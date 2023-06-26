import express from 'express'
import cors from 'cors'
import chatMessagesController from './controllers/chatMessages.js'
import profilePicturesController from './controllers/profilePictures.js'

const app = express()

app
  .use(express.json())
  .use(cors())
  .use('/api/chats', chatMessagesController)
  .use('/api/profile-pictures', profilePicturesController)
  .listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
