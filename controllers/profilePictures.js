import express from 'express'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

dotenv.config()
const router = express.Router()

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

function getKey(pictureId) {
  return `${process.env.S3_PROFILE_PICTURES_DIR}/${pictureId}`
}

router.get('/:pictureId', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: getKey(req.params.pictureId),
    }
    const url = await s3.getSignedUrlPromise('getObject', params)
    res.json(url)
  } catch (error) {
    console.error('Error retrieving file from S3:', error)
    res.status(500).send('Error retrieving file')
  }
})

router.post('/', async (req, res) => {
  try {
    if (!req.body || !req.body.fileData) {
      res.status(400).send('No file data provided')
      return
    }

    const { fileData } = req.body

    const fileType = fileData.substring(
      fileData.indexOf('/') + 1,
      fileData.indexOf(';base64')
    )
    const pictureId = uuidv4()

    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
    const bufferData = Buffer.from(base64Data, 'base64')

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: getKey(pictureId),
      Body: bufferData,
      ContentEncoding: 'base64',
      ContentType: `image/${fileType}`,
    }
    await s3.upload(params).promise()

    res.json({
      success: true,
      message: 'File uploaded successfully',
      pictureId,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
    })
  }
})

router.put('/:pictureId', async (req, res) => {
  try {
    if (!req.body || !req.body.fileData) {
      res.status(400).send('No file data provided')
      return
    }

    const { fileData } = req.body
    const { pictureId } = req.params

    const fileType = fileData.substring(
      fileData.indexOf('/') + 1,
      fileData.indexOf(';base64')
    )

    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
    const bufferData = Buffer.from(base64Data, 'base64')

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: getKey(pictureId),
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

export default router
