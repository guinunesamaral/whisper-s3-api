import express from 'express'
import AWS from 'aws-sdk'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const s3 = new AWS.S3()
const app = express()

app.use(express.json())

app.get('/api/files/:uniqueFileName', async (req, res) => {
  try {
    const { uniqueFileName } = req.params
    const bucketName = process.env.S3_BUCKET_NAME

    const params = {
      Bucket: bucketName,
      Key: uniqueFileName,
    }
    const response = await s3.getObject(params).promise()
    const fileContent = response.Body

    res.setHeader('Content-Type', response.ContentType)
    res.send(fileContent)
  } catch (error) {
    console.error('Error retrieving file from S3:', error)
    res.status(500).send('Error retrieving file')
  }
})

app.post('/api/files', async (req, res) => {
  try {
    if (!req.body || !req.body.fileData) {
      res.status(400).send('No file data provided')
      return
    }

    const { fileData } = req.body
    const bucketName = process.env.S3_BUCKET_NAME

    const fileType = fileData.substring(
      fileData.indexOf('/') + 1,
      fileData.indexOf(';base64')
    )
    const uniqueFileName = uuidv4()

    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
    const bufferData = Buffer.from(base64Data, 'base64')

    const params = {
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: bufferData,
      ContentEncoding: 'base64',
      ContentType: `image/${fileType}`,
    }
    const result = await s3.upload(params).promise()

    res.json({
      success: true,
      message: 'File uploaded successfully',
      location: result.Location,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
    })
  }
})
app.put('/api/files/:uniqueFileName', async (req, res) => {
  try {
    if (!req.body || !req.body.fileData) {
      res.status(400).send('No file data provided')
      return
    }

    const { uniqueFileName } = req.params
    const { fileData } = req.body
    const bucketName = process.env.S3_BUCKET_NAME

    const fileType = fileData.substring(
      fileData.indexOf('/') + 1,
      fileData.indexOf(';base64')
    )

    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
    const bufferData = Buffer.from(base64Data, 'base64')

    const params = {
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: bufferData,
      ContentEncoding: 'base64',
      ContentType: `image/${fileType}`,
    }
    await s3.putObject(params).promise()

    res.status(200).json({ message: 'File updated successfully.' })
  } catch (error) {
    console.error('Error updating file in S3:', error)
    res.status(500).send('File update failed')
  }
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
