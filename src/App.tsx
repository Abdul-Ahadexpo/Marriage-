import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Heart, Users } from 'lucide-react';
import type { Room, User } from './types';

function App() {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (roomId) {
      const roomRef = ref(database, `rooms/${roomId}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        setRoom(data);
      });

      return () => unsubscribe();
    }
  }, [roomId]);

  const createOrJoinRoom = async () => {
    if (!name || !gender) {
      setError('Please enter your name and gender');
      return;
    }

    let targetRoomId = roomId;
    if (!targetRoomId) {
      targetRoomId = uuidv4();
    }

    const roomRef = ref(database, `rooms/${targetRoomId}`);
    const snapshot = await get(roomRef);
    const currentRoom = snapshot.val();

    if (currentRoom && Object.keys(currentRoom.users || {}).length >= 2) {
      setError('Room is full');
      return;
    }

    const newUser: User = { name, gender };
    const updatedRoom = {
      id: targetRoomId,
      users: {
        ...(currentRoom?.users || {}),
        [uuidv4()]: newUser
      }
    };

    await set(roomRef, updatedRoom);
    setRoomId(targetRoomId);
    setError('');
  };

  const agreeToVow = async (userId: string) => {
    if (!room || !roomId) return;
    
    const userRef = ref(database, `rooms/${roomId}/users/${userId}`);
    await set(userRef, {
      ...room.users[userId],
      hasAgreed: true
    });
  };

  const renderVowScreen = () => {
    if (!room) return null;
    const users = Object.entries(room.users);
    if (users.length !== 2) return null;

    const [user1Id, user1] = users[0];
    const [user2Id, user2] = users[1];

    return (
      <div className="space-y-8 text-center">
        <div className="text-2xl font-semibold text-gray-800">
          Say "I {user1.name} agree to Live my whole life with my future partner {user2.name}."
        </div>
        <div className="text-xl font-medium text-gray-600">
          Quabl Quabl
        </div>
        <div className="flex justify-center space-x-8">
          {users.map(([userId, user]) => (
            <div key={userId} className="text-center">
              <div className="mb-2">{user.name}</div>
              <button
                onClick={() => agreeToVow(userId)}
                disabled={user.hasAgreed}
                className={`px-6 py-3 rounded-lg ${
                  user.hasAgreed
                    ? 'bg-green-500 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                } transition-colors`}
              >
                {user.hasAgreed ? 'Agreed' : 'I Agree'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Love Promise</h1>
            <p className="text-gray-600">Join a room and make your promise of love</p>
          </div>

          {!roomId ? (
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Enter room ID (optional for joining)"
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="text-red-500 text-center">{error}</div>
              )}

              <button
                onClick={createOrJoinRoom}
                className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>{roomId ? 'Join Room' : 'Create Room'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Room ID:</div>
                <div className="bg-gray-100 p-3 rounded-lg text-gray-700 font-mono">
                  {roomId}
                </div>
              </div>

              {room && Object.keys(room.users).length < 2 && (
                <div className="text-center text-gray-600">
                  Waiting for another person to join...
                </div>
              )}

              {renderVowScreen()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;