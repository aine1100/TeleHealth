const AWS = require('aws-sdk');

let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new AWS.S3({
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: process.env.R2_REGION || 'auto',
      signatureVersion: 'v4'
    });
  }
  return s3Client;
};

exports.uploadFileToR2 = async (file, key) => {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const s3 = getS3Client();
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};
