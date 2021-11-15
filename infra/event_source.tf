resource "aws_sns_topic_subscription" "_" {
  topic_arn = var.messages_topic_arn
  protocol  = "lambda"
  endpoint  = module.server.lambda["alias_arn"]
}

resource "aws_lambda_permission" "with_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = module.server.lambda["arn"]
  qualifier     = module.server.lambda["alias"]
  principal     = "sns.amazonaws.com"
  source_arn    = var.messages_topic_arn
}

resource "aws_lambda_event_source_mapping" "_" {
  enabled                            = true
  batch_size                         = 10
  event_source_arn                   = var.messages_queue_arn
  function_name                      = module.server.lambda["alias_arn"]
  maximum_batching_window_in_seconds = 0 # Do not wait until batch size is fulfilled
}
