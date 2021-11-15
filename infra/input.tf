######################
#     VARIABLES      |
######################
variable "prefix" {}

variable "common_tags" {
  type = map(string)
}

variable "messages_queue_arn" {}
variable "messages_topic_arn" {}

variable "notifications_topic" {
  type = object({
    arn  = string
    name = string
  })
}

variable "notifications_queue" {
  type = object({
    arn = string
    url = string
  })
}

variable "connections_table" {
  type = object({
    name = string
    arn  = string
  })
}

# Github
# --------
variable "github" {
  description = "A map of strings with GitHub specific variables"
  type        = object({
    owner          = string
    connection_arn = string
    webhook_secret = string
  })
}

variable "pre_release" {
  default = true
}

variable "github_repository" {
  type = object({
    name   = string
    branch = string
  })
}

# S3 Buckets
# ----------
variable "s3_artifacts" {
  type = object({
    bucket = string
    arn    = string
  })
}

variable "ci_notifications_slack_channels" {
  description = "Slack channel name for notifying ci pipeline info/alerts"
  type        = object({
    info  = string
    alert = string
  })
}
