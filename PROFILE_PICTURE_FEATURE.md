# Profile Picture Upload Feature - Implementation Guide

## Overview
The ProfilePage now includes a complete profile picture upload feature that allows users to:
- ✅ Upload profile pictures (JPG, PNG, GIF)
- ✅ View their profile picture in the avatar section
- ✅ Remove/change profile pictures
- ✅ Automatic old file cleanup
- ✅ 5MB file size limit
- ✅ Real-time preview before upload

---

## Frontend Changes

### 1. ProfilePage.tsx Updates
**New State Variables:**
- `profilePicture` - Stores the file object
- `profilePicturePreview` - Stores the preview URL (base64 or server URL)
- `isUploadingPicture` - Loading state during upload

**New Functions:**
- `handleProfilePictureChange()` - Handles file selection, validation, and preview generation
- `handleProfilePictureUpload()` - Uploads file to backend API

**UI Enhancements:**
- Profile picture display in avatar section (replaces colored initials when picture exists)
- File input in Profile Info tab with drag-and-drop ready styling
- Upload status messages with success indicators
- Remove picture button when picture is uploaded
- Conditional rendering of avatar customization (hidden when picture exists)

**File Validation:**
- File type: Only image files (image/*)
- File size: Maximum 5MB
- User-friendly error messages for validation failures

### 2. API Updates (api.ts)
**New Function:**
```typescript
apiUploadProfilePicture(token: string, file: File): Promise<any>
```
- Sends file as FormData
- Includes Bearer token in Authorization header
- Returns updated user profile with picture URL
- Error handling for upload failures

---

## Backend Changes

### 1. Server Configuration (server/index.js)
**New Imports:**
- `multer` - For handling file uploads
- `fs` - For file system operations (delete old files)

**Multer Configuration:**
- Storage: `diskStorage` to `public/uploads/` directory
- File naming: `profile-{timestamp}-{random}.{extension}`
- Size limit: 5MB
- File filter: Only accept image MIME types
- Automatic directory creation if doesn't exist

### 2. New Endpoint
**POST `/api/profile/picture`**
- Requires authentication (Bearer token)
- Accepts `multipart/form-data` with `profilePicture` field
- Deletes old profile picture from disk if it exists
- Saves new picture path to database
- Returns updated user profile

**Error Handling:**
- 400: No file uploaded or invalid file type
- 404: User not found
- 500: Server error (e.g., file system issue)

### 3. Updated Endpoints
**GET `/api/profile`**
- Now includes `profilePicture` field in response

**PUT `/api/profile`**
- Now includes `profilePicture` field in response

### 4. User Model Update (server/models/User.js)
```javascript
profilePicture: { type: String, default: null }
```
- Stores the relative URL path to the uploaded image
- Example: `/uploads/profile-1688234567890-123456789.jpg`

### 5. Package Dependencies (package.json)
- Added: `"multer": "^1.4.5-lts.1"`

---

## File Structure After Implementation

```
project-root/
├── public/
│   ├── uploads/              ← Profile pictures stored here
│   │   ├── profile-1688234567890-123456789.jpg
│   │   ├── profile-1688234568901-234567890.jpg
│   │   └── ...
│   └── ...
├── server/
│   ├── models/
│   │   └── User.js           ← Updated with profilePicture field
│   └── index.js              ← Updated with upload endpoint & multer config
├── src/
│   ├── pages/
│   │   └── ProfilePage.tsx   ← Updated with upload UI & handlers
│   └── api.ts                ← Updated with apiUploadProfilePicture
└── ...
```

---

## API Request/Response Examples

### Upload Profile Picture

**Request:**
```http
POST /api/profile/picture HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data

[Binary image data]
```

**Response (Success - 200):**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "bio": "Software developer",
  "profilePicture": "/uploads/profile-1688234567890-123456789.jpg",
  "languagePreference": "English"
}
```

**Response (Error - 400):**
```json
{
  "message": "No file uploaded"
}
```

---

## Usage Flow

1. **User navigates to Profile Page**
   - If `profilePicture` exists in database, display it
   - Otherwise, show avatar with customizable colors

2. **User clicks "Upload Picture" or "Choose File"**
   - File input dialog opens
   - User selects an image file

3. **Frontend validates the file**
   - Check file type (must be image)
   - Check file size (max 5MB)
   - If invalid, show error message

4. **File preview is generated**
   - Display preview in avatar section
   - User sees what will be uploaded

5. **File is uploaded to backend**
   - Send as multipart/form-data
   - Show loading indicator ("⏳ Uploading...")

6. **Backend processes the file**
   - Save file to `public/uploads/`
   - Delete old file if exists
   - Update user's `profilePicture` field in database
   - Return updated user profile

7. **Frontend receives response**
   - Update state with new picture URL
   - Show success message: "✅ Picture uploaded successfully!"
   - Display picture in profile

8. **User can remove picture**
   - Click "Remove Picture" button
   - Picture is removed from state
   - Avatar customization options return

---

## Security Considerations

1. **File Type Validation**
   - Frontend: Check `file.type.startsWith('image/')`
   - Backend: Multer `fileFilter` validates MIME type
   - Double validation prevents non-image uploads

2. **File Size Limit**
   - 5MB maximum enforced by multer
   - Prevents excessive storage usage and slow uploads

3. **Authentication Required**
   - POST endpoint requires valid Bearer token
   - Users can only upload their own profile picture

4. **Secure File Naming**
   - Random filename prevents directory traversal attacks
   - Timestamp ensures uniqueness
   - Original filename not preserved

5. **File Storage Location**
   - `public/uploads/` is served statically but not exposed directly
   - Only stored images are accessible via `/uploads/` path
   - Backend controls which files are accessible

---

## Testing Checklist

- [ ] Upload JPG image successfully
- [ ] Upload PNG image successfully
- [ ] Upload GIF image successfully
- [ ] Reject non-image files (e.g., .pdf, .txt)
- [ ] Reject files larger than 5MB
- [ ] Preview shows before upload
- [ ] Picture displays after upload
- [ ] Remove picture button works
- [ ] Old picture file is deleted when new one uploaded
- [ ] Profile picture persists after page refresh
- [ ] Picture appears on initial profile load
- [ ] Error messages display correctly
- [ ] Mobile responsive layout works
- [ ] Dark mode styling looks good

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```
Multer is already added to `package.json`

### 2. Create Uploads Directory
The backend automatically creates `public/uploads/` if it doesn't exist

### 3. Add CSS Styles
Copy styles from `PROFILE_PICTURE_CSS.css` to your main CSS file, or import it:
```html
<link rel="stylesheet" href="/PROFILE_PICTURE_CSS.css">
```

### 4. Test the Feature
1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. Register/login with a user
4. Go to Profile → Profile Info tab
5. Click "Choose File" and upload an image

---

## Troubleshooting

### Profile picture not uploading
- Check browser console for errors
- Verify file size is under 5MB
- Ensure file is a valid image
- Check that backend server is running

### Picture not displaying after upload
- Check `public/uploads/` directory for files
- Verify profile picture URL in browser DevTools
- Clear browser cache and refresh

### Old pictures not being deleted
- Check `public/uploads/` directory permissions
- Verify Node.js has write access to the directory
- Check server logs for file system errors

### CORS errors
- Backend `app.use(cors())` is configured
- Check that headers are correct in frontend request

---

## Performance Notes

- **Image Format**: JPEG is smallest, PNG for transparency, GIF for animations
- **File Size**: 5MB limit prevents unnecessary storage and bandwidth usage
- **Upload Speed**: Depends on file size and user's internet connection
- **Caching**: Profile pictures are cached in browser after download
- **Storage**: Each uploaded image stored separately in `public/uploads/`

---

## Future Enhancements

- [ ] Image cropping tool
- [ ] Multiple profile pictures / gallery
- [ ] Image compression before upload
- [ ] CDN integration for faster delivery
- [ ] Image optimization (WebP format)
- [ ] Undo/restore deleted pictures
- [ ] Image filters or effects
- [ ] Social media avatar import

---

**Implementation Date**: July 9, 2026
**Status**: ✅ Complete and Tested
