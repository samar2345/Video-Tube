import multer from 'multer'

//template of code copied from github of multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //req is the json data received from the client side, and file is the file data received from the client side, cb is a callback 
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)    //used for differnet filename
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
    cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    // storage: storage No need as we are using es6
    storage
})