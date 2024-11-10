import { del, list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const customFileName = formData.get('customFileName') as string;
        const addSuffix = formData.get('addSuffix') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = customFileName || file.name;

        const { url, pathname } = await put(fileName, file, {
            access: 'public',
            addRandomSuffix: addSuffix,
            // Add onUploadProgress callback if needed on server side
        });

        return NextResponse.json({ url, pathname });
    } catch (error) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
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
        await del(url);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
} 