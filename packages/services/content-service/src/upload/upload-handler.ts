import multer from 'multer'
import { Request, Response } from 'express'
import crypto from 'crypto'

// AWS S3 Configuration (or use other storage like Cloudflare R2)
const S3_BUCKET = process.env.S3_BUCKET || 'consultancy-content'
const S3_REGION = process.env.S3_REGION || 'us-east-1'

// Storage configuration
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Content Upload Handler
export const uploadContent = upload.single('file')

export async function handleContentUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { consultantId, contentType, title, description, price, isFree } = req.body

    // Validate input
    if (!consultantId || !contentType || !title) {
      return res.status(400).json({
        error: 'Missing required fields: consultantId, contentType, title'
      })
    }

    // Generate unique filename
    const fileHash = crypto.randomBytes(16).toString('hex')
    const extension = getFileExtension(req.file.mimetype)
    const filename = `${contentType}/${consultantId}/${fileHash}.${extension}`

    // Upload to S3
    const uploadResult = await uploadToS3({
      bucket: S3_BUCKET,
      key: filename,
      body: req.file.buffer,
      contentType: req.file.mimetype,
      metadata: {
        consultantId,
        contentType,
        title,
      },
    })

    // Generate thumbnail for video/image
    let thumbnailUrl = null
    if (contentType === 'video' || contentType === 'image') {
      thumbnailUrl = await generateThumbnail(req.file.buffer, contentType)
    }

    // Get video duration if applicable
    let durationSeconds = null
    if (contentType === 'video' || contentType === 'audio') {
      durationSeconds = await getMediaDuration(req.file.buffer, contentType)
    }

    // Create content record in database
    const contentRecord = await createContentRecord({
      consultantId,
      contentType,
      title,
      description,
      fileUrl: uploadResult.url,
      thumbnailUrl,
      fileSize: req.file.size,
      format: extension,
      durationSeconds,
      price: parseFloat(price) || 0,
      isFree: isFree === 'true',
      status: 'pending',
    })

    // Start async processing (transcription for videos, etc.)
    if (contentType === 'video') {
      startVideoProcessing(contentRecord.id, uploadResult.url)
    }

    res.status(201).json({
      id: contentRecord.id,
      fileUrl: uploadResult.url,
      thumbnailUrl,
      status: 'pending',
      message: 'Content uploaded successfully. Processing will begin shortly.',
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload content' })
  }
}

// Upload to S3 (using AWS SDK would be actual implementation)
async function uploadToS3(params: {
  bucket: string
  key: string
  body: Buffer
  contentType: string
  metadata: Record<string, string>
}): Promise<{ url: string }> {
  // Mock implementation - in production use AWS SDK
  const url = `https://${params.bucket}.s3.${S3_REGION}.amazonaws.com/${params.key}`

  console.log('Uploading to S3:', {
    bucket: params.bucket,
    key: params.key,
    size: params.body.length,
    contentType: params.contentType,
  })

  // In production:
  // const s3 = new AWS.S3({
  //   accessKeyId: S3_ACCESS_KEY,
  //   secretAccessKey: S3_SECRET_KEY,
  //   region: S3_REGION,
  // })
  // await s3.putObject({
  //   Bucket: params.bucket,
  //   Key: params.key,
  //   Body: params.body,
  //   ContentType: params.contentType,
  //   Metadata: params.metadata,
  // }).promise()

  return { url }
}

// Generate Thumbnail
async function generateThumbnail(buffer: Buffer, contentType: string): Promise<string> {
  // In production, use FFmpeg or similar
  console.log('Generating thumbnail for:', contentType)

  // Mock URL
  return 'https://example.com/thumbnail.jpg'
}

// Get Media Duration
async function getMediaDuration(_buffer: Buffer, _contentType: string): Promise<number> {
  // In production, use FFprobe or similar
  return 300 // 5 minutes mock
}

// Start Video Processing
async function startVideoProcessing(contentId: string, _videoUrl: string) {
  // Queue job for:
  // - Transcoding to multiple formats
  // - Generating thumbnails at key frames
  // - Extracting audio for transcription
  // - Creating HLS/DASH streaming versions

  console.log('Starting video processing for:', contentId)

  // In production, send to processing queue (e.g., SQS, Kafka)
}

// Create Content Record
async function createContentRecord(_data: any): Promise<{ id: string }> {
  // In production, call content-service API or database
  return { id: crypto.randomUUID() }
}

// File Extension Helper
function getFileExtension(mimetype: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  }

  return map[mimetype] || 'bin'
}

// Stream Content
export async function streamContent(req: Request, res: Response) {
  const { contentId } = req.params

  try {
    // Get content info
    const content = await getContentInfo(contentId)

    if (!content) {
      return res.status(404).json({ error: 'Content not found' })
    }

    // Check access (purchase or free)
    const userId = req.headers['x-user-id'] as string
    const hasAccess = await checkContentAccess(contentId, userId)

    if (!hasAccess && !content.isFree) {
      return res.status(403).json({ error: 'Access denied. Please purchase this content.' })
    }

    // Generate signed URL for streaming (S3)
    const signedUrl = await generateSignedUrl(content.fileUrl)

    // For videos, support range requests
    if (content.contentType === 'video') {
      // HLS/DASH streaming URL
      const hlsUrl = getHlsUrl(content.fileUrl)
      return res.json({
        streamingUrl: hlsUrl,
        duration: content.durationSeconds,
        thumbnail: content.thumbnailUrl,
      })
    }

    // For other content, return direct URL
    res.json({
      url: signedUrl,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to stream content' })
  }
}

// Get Content Info
async function getContentInfo(_contentId: string): Promise<any | null> {
  // In production, call content-service API
  return null
}

// Check Content Access
async function checkContentAccess(_contentId: string, _userId: string): Promise<boolean> {
  // In production, check purchase records
  return false
}

// Generate Signed URL
async function generateSignedUrl(fileUrl: string): Promise<string> {
  // In production, use AWS S3 getSignedUrl
  return fileUrl
}

// Get HLS URL
function getHlsUrl(fileUrl: string): string {
  // Convert base URL to HLS manifest URL
  return fileUrl.replace(/\.mp4$/, '/playlist.m3u8')
}

// Content Search
export async function searchContent(req: Request, res: Response) {
  const { query, vertical, contentType, page = 1, limit = 20 } = req.query

  try {
    // Call search-service or content-service
    const results = await performContentSearch({
      query: query as string,
      vertical: vertical as string,
      contentType: contentType as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })

    res.json({
      results: results,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })
  } catch (error) {
    res.status(500).json({ error: 'Search failed' })
  }
}

async function performContentSearch(_params: any): Promise<any[]> {
  // In production, call search-service API
  return []
}

// Content Purchase
export async function purchaseContent(req: Request, res: Response) {
  const { contentId } = req.params
  const userId = req.headers['x-user-id'] as string

  try {
    const content = await getContentInfo(contentId)

    if (!content) {
      return res.status(404).json({ error: 'Content not found' })
    }

    if (content.isFree) {
      // Grant access immediately
      await grantContentAccess(contentId, userId)
      return res.json({ message: 'Free content - access granted' })
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: content.price,
      userId,
      contentType: 'content_purchase',
      contentId,
    })

    res.json({
      clientSecret: paymentIntent.clientSecret,
      amount: content.price,
    })
  } catch (error) {
    res.status(500).json({ error: 'Purchase failed' })
  }
}

async function grantContentAccess(_contentId: string, _userId: string): Promise<void> {
  // In production, create access record in database
}

async function createPaymentIntent(_data: any): Promise<{ clientSecret: string }> {
  // In production, call billing-service API
  return { clientSecret: 'mock_secret' }
}

export default {
  uploadContent,
  handleContentUpload,
  streamContent,
  searchContent,
  purchaseContent,
}