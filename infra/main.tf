data "aws_region" "current" {}

locals {
  prefix = "${var.prefix}-sumu-demo"

  common_tags = {module = "sumu-demo"}
}
