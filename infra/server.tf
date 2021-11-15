module "server" {
  source      = "git::https://github.com/obytes/terraform-aws-codeless-lambda.git//modules/lambda"
  prefix      = "${local.prefix}-server"
  common_tags = local.common_tags
  description = "SUMU Demo Server"

  runtime     = "python3.8"
  handler     = "src.main.handler"
  timeout     = 120
  memory_size = 1024
  policy_json = data.aws_iam_policy_document.custom_policy_doc.json

  envs    = {
    CONNECTIONS_TABLE       = var.connections_table.name
    NOTIFICATIONS_TOPIC_ARN = var.notifications_topic.arn
    NOTIFICATIONS_QUEUE_URL = var.notifications_queue.url
  }
}


module "server_ci" {
  source      = "git::https://github.com/obytes/terraform-aws-lambda-ci.git//modules/ci"
  prefix      = "${local.prefix}-server-ci"
  common_tags = local.common_tags

  # Lambda
  lambda                   = module.server.lambda
  app_src_path             = "app/server"
  packages_descriptor_path = "app/server/requirements/lambda.txt"

  # Github
  s3_artifacts      = var.s3_artifacts
  github            = var.github
  pre_release       = var.pre_release
  github_repository = var.github_repository

  # Notifications
  ci_notifications_slack_channels = var.ci_notifications_slack_channels
}
