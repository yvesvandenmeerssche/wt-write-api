#!/bin/bash

ENVIRONMENT=$1

# AWS command opts
TASK_FAMILY="$ENVIRONMENT-wt-write-api"
SERVICE_NAME="$ENVIRONMENT-wt-write-api"
AWS_REGION="eu-west-1"

# container setup options
LATEST_TAG=`git describe --abbrev=0 --tags`

# container startup options
WT_CONFIG=$ENVIRONMENT
INFURA_API_KEY=$INFURA_API_KEY

TASK_DEF="[{\"portMappings\": [{\"hostPort\": 0,\"protocol\": \"tcp\",\"containerPort\": 8000}],
    \"environment\": [
      {
        \"name\": \"INFURA_API_KEY\",
        \"value\": \"$INFURA_API_KEY\"
      },
      {
        \"name\": \"WT_API_BASE_URL\",
        \"value\": \"https://$ENVIRONMENT-write-api.windingtree.com\"
      },
      {
        \"name\": \"WT_CONFIG\",
        \"value\": \"$WT_CONFIG\"
      }
    ],
    \"image\": \"029479441096.dkr.ecr.eu-west-1.amazonaws.com/wt-write-api:$LATEST_TAG\",
    \"name\": \"wt-write-api\"
  }]"

echo "Updating task definition"
aws ecs register-task-definition --region $AWS_REGION --family $TASK_FAMILY --container-definitions "$TASK_DEF" --memory 512 --cpu 1024 > /dev/null
echo "Updating service"
aws ecs update-service --region $AWS_REGION --cluster shared-docker-cluster  --service "$SERVICE_NAME" --task-definition "$TASK_FAMILY" > /dev/null
