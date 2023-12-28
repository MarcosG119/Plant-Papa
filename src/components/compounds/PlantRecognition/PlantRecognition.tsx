import React, { useState, ChangeEvent, useEffect } from 'react';
import Compressor from 'compressorjs';
import axios from 'axios';
import './PlantRecognition.css'
import Container from '../../elements/container/Container';

const ImageUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bestMatch, setBestMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    console.log(uploadedImage)
    if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    try {
        setLoading(true);

        // Compress the selected image with specified dimensions and quality
        const compressedImage = await compressImage(selectedFile, 800, 1280, 0.9);

        // Create FormData with the compressed image
        const formData = new FormData();
        formData.append('organs', 'flower');
        formData.append('images', compressedImage, 'compressed.jpg');

        const { status, data } = await axios.post('http://localhost:3000/api/plantnet/upload', formData);

        console.log('Response status:', status);
        console.log('Response data:', data);

        setBestMatch(data.bestMatch);
    } catch (error) {
        console.error('Frontend error uploading image:', error);
    } finally {
        setLoading(false);
    }
  };

  const compressImage = (file: File | null, smallSide: number, largeSide: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        new Compressor(file, {
            maxWidth: largeSide,
            maxHeight: smallSide,
            quality,
            success(result) {
            resolve(result);
            },
            error(err) {
            reject(err);
            },
        });
    });
  };

    return (
            <Container borderRadius='30px'>
            <div className='flex-box'>
                <input  type="file" onChange={handleFileChange} />
            
                {loading && <p style={{padding:'2%'}}>Uploading and processing image...</p>}
                {bestMatch && <p style={{padding:'2%'}}>{bestMatch}</p>}
                {uploadedImage && <img src={uploadedImage} alt="Uploaded" style={{ padding:'2%', maxWidth: '100%', maxHeight: '400px' }} />}
                <button style={{padding:'2%'}} onClick={handleUpload}>Upload</button>
                </div>
            </Container>
    );
};

export default ImageUpload;
