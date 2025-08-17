import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';
import admin from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    try {
      // Get Firebase Storage bucket
      const bucket = admin.storage().bucket('sportsmagasinet-database.firebasestorage.app');
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = image.name.split('.').pop();
      const fileName = `profile-images/${user.uid}/${timestamp}.${fileExtension}`;

      // Convert file to buffer
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Firebase Storage
      const file = bucket.file(fileName);
      
      await file.save(buffer, {
        metadata: {
          contentType: image.type,
          metadata: {
            userId: user.uid,
            uploadedAt: new Date().toISOString(),
          }
        }
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Delete old profile image if exists
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (userData?.profileImageUrl) {
        try {
          // Extract filename from old URL and delete
          const oldUrl = userData.profileImageUrl;
          const oldFileName = oldUrl.split('/').pop();
          if (oldFileName && oldFileName.includes(user.uid)) {
            const oldFile = bucket.file(`profile-images/${user.uid}/${oldFileName}`);
            await oldFile.delete().catch(() => {
              // Ignore errors if file doesn't exist
              console.log('Old profile image not found or already deleted');
            });
          }
        } catch (deleteError) {
          console.log('Error deleting old profile image:', deleteError);
          // Don't fail the upload if deletion fails
        }
      }

      // Log the upload
      await db.collection('activityLogs').add({
        type: 'profile_image_uploaded',
        userId: user.uid,
        timestamp: new Date(),
        metadata: {
          fileName,
          fileSize: image.size,
          fileType: image.type,
          userRole: user.role
        }
      });

      console.log('Profile image uploaded for user:', user.uid, 'URL:', publicUrl);

      return NextResponse.json({
        success: true,
        imageUrl: publicUrl,
        message: 'Image uploaded successfully'
      });

    } catch (storageError) {
      console.error('Storage error:', storageError);
      
      if (storageError.code === 'storage/unauthorized') {
        return NextResponse.json(
          { error: 'Storage access denied' },
          { status: 403 }
        );
      }
      
      if (storageError.code === 'storage/quota-exceeded') {
        return NextResponse.json(
          { error: 'Storage quota exceeded' },
          { status: 507 }
        );
      }

      throw storageError;
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
