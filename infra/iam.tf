###############################################
#                 LAMBDA POLICY               |
###############################################
data "aws_iam_policy_document" "custom_policy_doc" {
  # Output Topic
  statement {
    actions = [
      "sns:Publish",
    ]

    resources = [
      var.notifications_topic.arn
    ]
  }

  # Output Queue
  statement {
    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      var.notifications_queue.arn
    ]
  }

  # Input
  statement {
    actions = [
      "sqs:ChangeMessageVisibility",
      "sqs:ChangeMessageVisibilityBatch",
      "sqs:DeleteMessage",
      "sqs:DeleteMessageBatch",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage"
    ]

    resources = [
      var.messages_queue_arn
    ]
  }

  statement {
    actions = [
      "dynamodb:Query",
      "dynamodb:Scan",
    ]

    resources = [
      var.connections_table.arn,
    ]
  }
}
