import { del, list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const customFileName = formData.get('customFileName') as string;
        const addSuffix = formData.get('addSuffix') === 'true';

        if (!file) {
            console.error('No file provided in request');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            console.error('File too large:', file.size);
            return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }

        const fileName = customFileName || file.name;
        console.log('Attempting to upload file:', fileName);

        const { url, pathname } = await put(fileName, file, {
            access: 'public',
            addRandomSuffix: addSuffix,
            token: process.env.BLOB_READ_WRITE_TOKEN // Make sure this is set in Vercel
        });

        console.log('Upload successful:', url);
        return NextResponse.json({ url, pathname });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ 
            error: 'Upload failed', 
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { blobs } = await list();
        return NextResponse.json({ files: blobs });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { url } = await request.json();
        if (!url) {
            console.error('No URL provided for deletion');
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        console.log('Attempting to delete:', url);
        await del(url, {
            token: process.env.BLOB_READ_WRITE_TOKEN // Make sure this is set in Vercel
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ 
            error: 'Delete failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 