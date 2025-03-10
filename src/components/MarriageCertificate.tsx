import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { Room } from '../types';

interface Props {
  room: Room;
  onClose: () => void;
}

export const MarriageCertificate: React.FC<Props> = ({ room, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const users = Object.values(room.users);
  const witnesses = Object.values(room.witnesses || {});
  const marriageDate = room.marriageDate ? new Date(room.marriageDate) : new Date();

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `marriage-certificate-${room.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div ref={certificateRef} className="bg-white">
          <div className="text-center border-8 border-double border-emerald-600 p-8">
            <h1 className="text-4xl font-bold text-emerald-800 mb-6">Marriage Certificate</h1>
            <div className="text-xl mb-2 text-center">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
            
            <div className="my-8">
              <p className="text-lg mb-6">
                This is to certify that on {format(marriageDate, 'd MMMM, yyyy')},
                {room.location && ` in ${room.location},`} a marriage was solemnized between:
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {users.map((user, index) => (
                  <div key={index} className="text-left">
                    <h3 className="font-bold mb-2">{index === 0 ? 'Groom' : 'Bride'}</h3>
                    <p>Name: {user.name}</p>
                    {user.wali && <p>Wali: {user.wali}</p>}
                    {user.mehr !== undefined && <p>Mehr: {user.mehr} units</p>}
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <h3 className="font-bold mb-2">Witnesses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {witnesses.map((witness, index) => (
                    <div key={index} className="text-left">
                      <p>Name: {witness.name}</p>
                      <p className="text-sm text-gray-600">
                        Witnessed at: {format(witness.timestamp, 'HH:mm, d MMM yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 text-sm text-gray-600">
              <p>Certificate ID: {room.id}</p>
              <p>Generated on: {format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={downloadCertificate}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
};