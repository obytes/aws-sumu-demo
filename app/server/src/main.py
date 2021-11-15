import json
import os
from typing import Callable, Any

import boto3


class Channels:

    def __init__(self, records):
        self.sns = boto3.client("sns")
        self.sqs = boto3.client("sqs")
        self.records = records

    def publish_message(self, message):
        self.sns.publish(
            TargetArn=os.environ.get("NOTIFICATIONS_TOPIC_ARN"),
            Message=json.dumps(message),
        )

    def send_message(self, message):
        self.sqs.send_message(
            QueueUrl=os.environ.get("NOTIFICATIONS_QUEUE_URL"),
            MessageBody=json.dumps(message),
        )

    def parse_message(self):
        if "Sns" in self.records[0]:
            value_key = "Value"
            payload = self.records[0]["Sns"]
            sxs_message = json.loads(payload["Message"])
            attributes = payload["MessageAttributes"]
            push = self.publish_message
        else:
            value_key = "stringValue"
            payload = self.records[0]
            sxs_message = json.loads(payload["body"])
            attributes = payload["messageAttributes"]
            push = self.send_message

        attrs = {key: item[value_key] for key, item in attributes.items()}
        return sxs_message, attrs, push


def handler(event, context):
    """
    Demo processor that does not have any real utility
    Just used to illustrate how backend applications can interact with SUMU
    :param event: events coming from SUMU integration (SNS or SQS)
    :param context: Lambda Context
    """
    print(event)
    channels = Channels(event["Records"])
    handle_event(*channels.parse_message())


def handle_presence(message: Any, originator_id):
    """
    Broadcast the presence event to all users except originator
    :param message: message
    :param originator_id: originator user
    """
    return {
        "exclude_users": [originator_id],
        "data": {
            "type": "presence",
            "message": message,
        }
    }


def handle_message(message: Any, message_timestamp: int, sender_id: str):
    """
    Send a chat message from originator client to receivers clients
    When push mode is:
    1 - UNICAST: echo message to its sender.
    2 - MULTICAST: send message to multiple clients except originators
    3 - BROADCAST: send message to all clients except originators
    :param message: message to push
    :param message_timestamp: messages timestamp
    :param sender_id: sender id
    :return:
    """
    # Decide push mode
    push_mode = message["push_mode"]
    users = None
    exclude_users = None
    if push_mode == "UNICAST":
        users = [sender_id]
    elif push_mode == "MULTICAST":
        try:
            users = message["users"]
        except KeyError:
            print("[WARNING] Push mode is multicast. however, no users provided. Skip!")
            return
    elif push_mode == "BROADCAST":
        exclude_users = [sender_id, ]
    return {
        "users": users,
        "exclude_users": exclude_users,
        "data": {
            "type": "message",
            "message": {
                "text": message["text"],
                "user_id": sender_id,
                "timestamp": message_timestamp
            }
        }
    }


def handle_connections_request(requester_id):
    """
    Get all distinct connected users except requester user
    :param requester_id: requester
    :return: message
    """
    connections = get_connections([requester_id])
    connected_users = list(set([connection["user_id"] for connection in connections]))
    return {
        "users": [requester_id],
        "data": {
            "type": "connected_users",
            "message": {
                "users": connected_users,
            }
        }
    }


def handle_event(sxs_message: Any, attributes: dict, push: Callable):
    """
    Presence/Routes events, could be:
    1 - coming from APIGW->DDB->Watchdog-SNS (Subscription)
    2 - coming from APIGW->DDB->Watchdog-SQS (Polling)
    3 - directly from APIGW->DDB (Stream)
    Broadcast the event to all users except originator
    1 - SNS->PUSHER-APIGW
    2 - SQS->PUSHER-APIGW
    :param sxs_message:
    :param attributes:
    :param push: channel push method
    """
    caller_id = attributes["user_id"]
    event_source = attributes["source"]
    message = sxs_message["message"]
    m_type = sxs_message["type"]
    m = None

    if event_source == "lambda.presence.watchdog" and m_type == "presence":
        # Handle events coming from presence watchdog
        m = handle_presence(message, caller_id)
    elif event_source.startswith("apigw.route."):
        # Handle events coming from "apigw.route.publish" and "apigw.route.send"
        if m_type == "message":
            m = handle_message(message, int(attributes["timestamp"]), caller_id)
        elif m_type == "get_connected_users":
            m = handle_connections_request(caller_id)
    if m:
        push(m)


def get_connections(exclude_users_ids):
    excluded_users = ', '.join([f":id{idx}" for idx, _ in enumerate(exclude_users_ids)])
    params = dict(
        ExpressionAttributeNames={
            "#user_id": "user_id"
        },
        FilterExpression=f"NOT(#user_id in ({excluded_users}))",
        ExpressionAttributeValues={f":id{idx}": user_id for idx, user_id in enumerate(exclude_users_ids)}
    )
    resource = boto3.resource("dynamodb")
    connections_table = resource.Table(os.environ["CONNECTIONS_TABLE"])
    result = connections_table.scan(**params)
    connections = result.get("Items")
    while result.get("LastEvaluatedKey"):
        result = connections_table.scan(ExclusiveStartKey=result["LastEvaluatedKey"], **params)
        connections.extend(result["Items"])
    return connections
