import { useState, useRef } from 'react';
import {
    generateKeyFromPassword,
    encryptData,
    decryptData,
    generateSalt,
    base64ToBuffer,
    bufferToBase64
} from './crypto.ts';
import QRCode from 'react-qr-code';

function App() {
    const [password, setPassword] = useState('');
    const [saltInput, setSaltInput] = useState('');
    const [ivInput, setIvInput] = useState('');
    const [salt, setSalt] = useState<Uint8Array | null>(null);
    const [iv, setIv] = useState<Uint8Array | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    const encryptInputRef = useRef<HTMLInputElement>(null);
    const decryptInputRef = useRef<HTMLInputElement>(null);

    const handleEncrypt = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer();
        const newSalt = generateSalt();
        const key = await generateKeyFromPassword(password, newSalt);
        const { iv, encrypted } = await encryptData(key, arrayBuffer);

        setSalt(newSalt);
        setIv(iv);
        setSaltInput(bufferToBase64(newSalt));
        setIvInput(bufferToBase64(iv));
        setFileName(`encrypted-${file.name}`);
        setDownloadUrl(URL.createObjectURL(new Blob([encrypted])));
    };

    const handleDecrypt = async (file: File) => {
        if (!saltInput || !ivInput) return alert('Please enter Salt and IV');
        const encryptedBuffer = await file.arrayBuffer();
        const key = await generateKeyFromPassword(password, base64ToBuffer(saltInput));
        try {
            const decrypted = await decryptData(key, encryptedBuffer, base64ToBuffer(ivInput));
            setDownloadUrl(URL.createObjectURL(new Blob([decrypted])));
            setFileName(`decrypted-${file.name}`);
        } catch {
            alert('Decryption failed. Is the password correct?');
        }
    };

    const qrValue = salt && iv ? JSON.stringify({ salt: bufferToBase64(salt), iv: bufferToBase64(iv) }) : '';

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-center">🔐 Local PDF Encryption</h1>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">🔑 Password</label>
                    <input
                        type="password"
                        placeholder="Password for encryption"
                        className="w-full px-4 py-2 text-black rounded shadow"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">🧂 Salt (Base64)</label>
                    <input
                        type="text"
                        placeholder="Salt (Base64)"
                        className="w-full px-4 py-2 text-black rounded shadow"
                        value={saltInput}
                        onChange={(e) => setSaltInput(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">🔁 IV (Base64)</label>
                    <input
                        type="text"
                        placeholder="IV (Base64)"
                        className="w-full px-4 py-2 text-black rounded shadow"
                        value={ivInput}
                        onChange={(e) => setIvInput(e.target.value)}
                    />
                </div>

                <div className="space-y-2 text-center">
                    <button
                        onClick={() => encryptInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
                    >
                        📤 Encrypt File (Upload)
                    </button>
                    <input
                        ref={encryptInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleEncrypt(e.target.files[0])}
                    />
                </div>

                <div className="space-y-2 text-center">
                    <button
                        onClick={() => decryptInputRef.current?.click()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded shadow"
                    >
                        📥 Decrypt File (Upload)
                    </button>
                    <input
                        ref={decryptInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleDecrypt(e.target.files[0])}
                    />
                </div>

                {downloadUrl && (
                    <div className="text-center">
                        <a
                            href={downloadUrl}
                            download={fileName}
                            className="inline-block bg-green-600 hover:bg-green-700 transition px-6 py-2 rounded text-white font-semibold mt-4"
                        >
                            ⬇️ Download {fileName}
                        </a>
                    </div>
                )}

                {qrValue && (
                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-300">📱 QR Code (Salt & IV):</p>
                        <div className="inline-block bg-white p-2 rounded">
                            <QRCode value={qrValue} size={128} bgColor="#fff" fgColor="#000" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
