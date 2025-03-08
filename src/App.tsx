import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { Heart, Users, Eye, Star } from 'lucide-react';
import type { Room, User } from './types';

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState('participant');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (roomId) {
      console.log('Attempting to connect to room:', roomId);
      const roomRef = ref(database, `rooms/${roomId}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Room data update:', data);
        if (data) {
          setRoom(data);
          // Check if both users have completed their Kabul
          const users = Object.values(data.users);
          if (users.length === 2 && users.every(user => user.kabulCount === 3)) {
            setShowCongrats(true);
            // Mark room as completed
            set(ref(database, `rooms/${roomId}/isCompleted`), true)
              .catch(error => {
                console.error('Error marking room as completed:', error);
              });
          }
        } else {
          console.log('No data found for room:', roomId);
        }
      }, (error) => {
        console.error('Error subscribing to room updates:', error);
        setError('Failed to connect to room: ' + error.message);
      });

      return () => {
        console.log('Unsubscribing from room:', roomId);
        unsubscribe();
      };
    }
  }, [roomId]);

  const createRoom = async () => {
    try {
      if (!name || !gender) {
        setError('Please enter your name and gender');
        return;
      }

      const newRoomId = uuidv4();
      console.log('Creating new room:', newRoomId);

      const newUser: User = { name, gender, kabulCount: 0 };
      const newRoom = {
        id: newRoomId,
        users: {
          [uuidv4()]: newUser
        },
        witnessCount: 0
      };

      const roomRef = ref(database, `rooms/${newRoomId}`);
      await set(roomRef, newRoom);
      console.log('Room created successfully:', newRoomId);
      setRoomId(newRoomId);
      setError('');
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room: ' + (error as Error).message);
    }
  };

  const joinRoom = async () => {
    try {
      if (!name || !gender || !joinRoomId) {
        setError('Please enter all required information');
        return;
      }

      console.log('Attempting to join room:', joinRoomId);
      const roomRef = ref(database, `rooms/${joinRoomId}`);
      const snapshot = await get(roomRef);
      const currentRoom = snapshot.val();

      if (!currentRoom) {
        console.error('Room not found:', joinRoomId);
        setError('Room not found');
        return;
      }

      if (role === 'witness') {
        console.log('Joining as witness');
        await set(ref(database, `rooms/${joinRoomId}/witnessCount`), (currentRoom.witnessCount || 0) + 1);
        setRoomId(joinRoomId);
        setError('');
        return;
      }

      if (Object.keys(currentRoom.users || {}).length >= 2) {
        console.error('Room is full:', joinRoomId);
        setError('Room is full');
        return;
      }

      const newUser: User = { name, gender, kabulCount: 0 };
      const updatedRoom = {
        ...currentRoom,
        users: {
          ...currentRoom.users,
          [uuidv4()]: newUser
        }
      };

      await set(roomRef, updatedRoom);
      console.log('Successfully joined room:', joinRoomId);
      setRoomId(joinRoomId);
      setError('');
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room: ' + (error as Error).message);
    }
  };

  const sayKabul = async (userId: string) => {
    try {
      if (!room || !roomId) {
        console.error('No room data available');
        return;
      }
      
      console.log('Saying Kabul for user:', userId);
      const currentCount = room.users[userId].kabulCount || 0;
      const userRef = ref(database, `rooms/${roomId}/users/${userId}`);
      await set(userRef, {
        ...room.users[userId],
        kabulCount: currentCount + 1
      });
      console.log('Kabul count updated successfully');
    } catch (error) {
      console.error('Error updating Kabul count:', error);
      setError('Failed to update Kabul: ' + (error as Error).message);
    }
  };

  const renderNikahScreen = () => {
    if (!room) return null;
    const users = Object.entries(room.users);
    if (users.length !== 2) return null;

    const [user1Id, user1] = users[0];
    const [user2Id, user2] = users[1];

    return (
      <div className="space-y-8 text-center">
        <div className="text-2xl font-semibold text-gray-800 leading-relaxed">
          <div className="mb-4">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
          <div>Do you {user1.name} accept {user2.name} as your lawful spouse in accordance with Islamic law?</div>
          <div className="text-lg text-gray-600 mt-2">
            Say "Kabul" three times to accept
          </div>
        </div>

        <div className="flex justify-center space-x-8">
          {users.map(([userId, user]) => (
            <div key={userId} className="text-center">
              <div className="mb-2">{user.name}</div>
              <div className="mb-2">
                {Array(3).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    className={`inline-block w-6 h-6 mx-1 ${
                      (user.kabulCount || 0) > i ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => sayKabul(userId)}
                disabled={user.kabulCount === 3}
                className={`px-6 py-3 rounded-lg ${
                  user.kabulCount === 3
                    ? 'bg-green-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                } transition-colors`}
              >
                {user.kabulCount === 3 ? 'Completed' : 'Say Kabul'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-gray-600">
          <Eye className="inline-block w-5 h-5 mr-2" />
          {room.witnessCount} Witnesses Present
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Halal Nikah</h1>
            <p className="text-gray-600">Join a room to participate in or witness a blessed nikah ceremony</p>
          </div>

          {showCongrats && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md mx-4">
                <h2 className="text-3xl font-bold text-emerald-600 mb-4">Congratulations!</h2>
                <p className="text-xl text-gray-700 mb-6">
                  May Allah bless this union and grant you both happiness and prosperity in your marriage.
                </p>
                <button
                  onClick={() => setShowCongrats(false)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!roomId ? (
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="participant">Participant</option>
                  <option value="witness">Witness</option>
                </select>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <button
                      onClick={createRoom}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Users className="w-5 h-5" />
                      <span>Create New Room</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter room ID to join"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-2"
                    />
                    <button
                      onClick={joinRoom}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Users className="w-5 h-5" />
                      <span>Join Room</span>
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-center">{error}</div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Room ID:</div>
                <div className="bg-gray-100 p-3 rounded-lg text-gray-700 font-mono">
                  {roomId}
                </div>
              </div>

              {room && Object.keys(room.users || {}).length < 2 && role !== 'witness' && (
                <div className="text-center text-gray-600">
                  Waiting for another person to join...
                </div>
              )}

              {renderNikahScreen()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
