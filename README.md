## Node-RED on AWS Lambda using Amazon API Gateway and S3

In addition to Node-RED, this directory includes 

- [Swagger file](http://swagger.io/specification/)
- [CloudFormation template](https://aws.amazon.com/cloudformation/aws-cloudformation-templates/)
- [Serverless Application Model (SAM)](https://github.com/awslabs/serverless-application-model)
- helper scripts to help you set up and manage your application.

### Steps for running the Node-RED
This guide assumes you have already [set up an AWS account](http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/AboutAWSAccounts.html) and have the latest version of the [AWS CLI](https://aws.amazon.com/cli/) installed.

1. From your preferred project directory:

    ```
    git clone https://github.com/sakazuki/aws-serverless-node-red.git
    cd aws-serverless-node-red
    ```

2. Run the following command to configure your variables.
    ```
    npm run config -- --account-id="<accountId>" --bucket-name="<bucketName>" [--region="<region>" --function-name="<functionName>" --stack-name="<stackName>"]

    ### eg.
    npm run config -- --account-id="123456789012" --bucket-name="my-unique-bucket"
    ```

    This modifies the following files with your account ID, bucket, region, function name and stack name (region defaults to `us-east-1` and function name defaults to `slsNodeREDFunction`). 
    - `package.json`
    - `simple-proxy-api.yaml`
    - `cloudformation.yaml`
    - `settings.js` 
    
    If the bucket you specify does not yet exist, the next step will create it for you. This step modifies the existing files in-place; if you wish to make changes to these settings, you will need to modify these files manually.

3. Run the following command to installs the node dependencies, creates an S3 bucket (if it does not already exist), packages and deploys your serverless Express application to AWS Lambda, and creates an API Gateway proxy API.
    ```
    npm run setup

    ### Windows users:
    npm run win-setup
    ```

4. After the setup command completes, open the AWS CloudFormation console https://console.aws.amazon.com/cloudformation/home and switch to the region you specified. Select the `slsNodeREDStack` stack, then click the `ApiUrl` value under the __Outputs__ section - this will open a new page with your running API. 

5. If you would prefer to delete AWS assets that were just created, simply run `npm run delete-stack` to delete the CloudFormation Stack, including the API and Lambda Function. If you specified a new bucket in the `config` command for step 1 and want to delete that bucket, run `npm run delete-bucket`.

## Version
- Node.js version 6.10
- Node-RED version 0.17.5


## Reference
See the more details on how to customize an existing (or create a new) Node.js project based on this example. 
- [aws-serverless-express](https://github.com/awslabs/aws-serverless-express)