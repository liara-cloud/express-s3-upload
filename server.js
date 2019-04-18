const aws = require('aws-sdk');
const multer = require('multer');
const express = require('express');
const multerS3 = require('multer-s3')

const s3 = new aws.S3({
  signatureVersion: 'v4',
  s3ForcePathStyle: 'true',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'photos',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '_' + file.originalname)
    }
  }),
});

const app = express();

app.set('view engine', 'ejs');

app.get('/', async function (req, res) {
  const result = await s3.listObjectsV2({ Bucket: 'photos' }).promise();
  return res.render('index', { files: result.Contents });
});

app.post('/upload', upload.single('file'), function (req, res) {
  return res.redirect('/');
});

app.get('/download/:fileKey', function (req, res) {
  const { fileKey } = req.params;

  const url = s3.getSignedUrl('getObject', {
    Bucket: 'photos',
    Key: fileKey,
    Expires: 600, // 10 minutes
    ResponseContentDisposition: `attachment; filename="${fileKey}"`,
  });

  return res.redirect(url);
});

app.listen(3000, function () {
  console.log('Server is listening on http://localhost:3000');
});
