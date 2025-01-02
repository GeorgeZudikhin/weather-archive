#!/bin/bash

set -e

FUNCTION_NAME="uploadImage"  
ZIP_FILE="uploadImage.zip"   
HANDLER="uploadImage.handler"

if [ -f $ZIP_FILE ]; then
  echo "Removing old $ZIP_FILE"
  rm $ZIP_FILE
fi

echo "Creating deployment package..."
zip -r $ZIP_FILE uploadImage.js node_modules

echo "Updating AWS Lambda function: $FUNCTION_NAME..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://$ZIP_FILE

echo "Cleaning up..."
rm $ZIP_FILE

echo "Lambda function $FUNCTION_NAME updated successfully."
