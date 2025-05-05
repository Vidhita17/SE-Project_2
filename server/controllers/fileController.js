const uploadFile = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    // Create array of file information to return to client
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `http://localhost:9000/uploads/${file.filename}`
    }));

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      message: 'Error uploading files',
      error: error.message
    });
  }
};

module.exports = {
  uploadFile
};
