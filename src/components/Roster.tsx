"use client";

import React, { useState, useEffect } from 'react';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocalStorage from '@/hooks/useLocalStorage';
import { capitalizeName } from '@/utils';
import { validateName, validateRating, validatePosition } from '@/utils/validationUtils';
import { toast } from 'react-hot-toast';

interface Player {
  id: number;
  name: string;
  position: string;
  year: string;
  rating: string;
}

const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];
const years = ['FR', 'FR (RS)', 'SO', 'SO (RS)', 'JR', 'JR (RS)', 'SR', 'SR (RS)'];

type SortField = 'name' | 'position' | 'year' | 'rating';

const yearOrder: { [key: string]: number } = {
  'FR': 0, 'FR (RS)': 1, 'SO': 2, 'SO (RS)': 3, 'JR': 4, 'JR (RS)': 5, 'SR': 6, 'SR (RS)': 7
};

const Roster: React.FC = () => {
  const [players, setPlayers] = useLocalStorage<Player[]>('players', []);
  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id'>>({ name: '', position: '', year: '', rating: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({ field: 'rating', direction: 'desc' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Automatically sort players by rating when the component mounts or players change
    setSortConfig({ field: 'rating', direction: 'desc' });
  }, [players]);

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortConfig.field === 'year') {
      const yearDiff = yearOrder[a.year] - yearOrder[b.year];
      return sortConfig.direction === 'asc' ? yearDiff : -yearDiff;
    } else if (sortConfig.field === 'rating') {
      return sortConfig.direction === 'asc'
        ? parseInt(a.rating) - parseInt(b.rating)
        : parseInt(b.rating) - parseInt(a.rating);
    } else {
      if (a[sortConfig.field] < b[sortConfig.field]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.field] > b[sortConfig.field]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
  });

  const requestSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const addPlayer = () => {
    if (validatePlayer(newPlayer)) {
      try {
        setPlayers([...players, { ...newPlayer, id: Date.now(), name: capitalizeName(newPlayer.name) }]);
        setNewPlayer({ name: '', position: '', year: '', rating: '' });
        toast.success('Player added successfully!');
      } catch (error) {
        console.error('Error adding player:', error);
        toast.error('Failed to add player. Please try again.');
      }
    } else {
      toast.error('Please correct the errors before adding the player.');
    }
  };

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };

    if (validatePlayer(updatedPlayers[index])) {
      try {
        setPlayers(updatedPlayers);
        toast.success('Player updated successfully!');
      } catch (error) {
        console.error('Error updating player:', error);
        toast.error('Failed to update player. Please try again.');
      }
    } else {
      toast.error('Please correct the errors before updating the player.');
    }
  };

  const startEditing = (player: Player) => {
    setEditingId(player.id);
    setNewPlayer(player);
  };

  const saveEdit = () => {
    setPlayers(players.map(player =>
      player.id === editingId
        ? { ...newPlayer, id: player.id, name: capitalizeName(newPlayer.name) }
        : player
    ));
    setEditingId(null);
    setNewPlayer({ name: '', position: '', year: '', rating: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewPlayer({ name: '', position: '', year: '', rating: '' });
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(player => player.id !== id));
  };

  const validatePlayer = (player: Omit<Player, 'id'>): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!validateName(player.name)) {
      newErrors.name = 'Invalid name. Please enter a non-empty name up to 100 characters.';
    }
    if (!validatePosition(player.position)) {
      newErrors.position = 'Invalid position. Please select a valid position.';
    }
    if (!validateRating(player.rating)) {
      newErrors.rating = 'Invalid rating. Please enter a number between 0 and 99.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Roster</h1>

      <Card>
        <CardHeader className="text-xl font-semibold">
          {editingId ? 'Edit Player' : 'Add New Player'}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <Input
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              placeholder="Player Name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            <Select
              value={newPlayer.position}
              onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newPlayer.year}
              onValueChange={(value) => setNewPlayer({ ...newPlayer, year: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newPlayer.rating}
              onChange={(e) => setNewPlayer({ ...newPlayer, rating: e.target.value })}
              placeholder="Rating"
              className={errors.rating ? 'border-red-500' : ''}
            />
            {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
            {editingId ? (
              <div className="flex space-x-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button onClick={cancelEdit} variant="outline">Cancel</Button>
              </div>
            ) : (
              <Button onClick={addPlayer}>Add Player</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-xl font-semibold">Current Roster</CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <th className="text-center cursor-pointer" onClick={() => requestSort('name')}>
                  Name {sortConfig.field === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th className="text-center cursor-pointer" onClick={() => requestSort('position')}>
                  Position {sortConfig.field === 'position' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th className="text-center cursor-pointer" onClick={() => requestSort('year')}>
                  Year {sortConfig.field === 'year' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th className="text-center cursor-pointer" onClick={() => requestSort('rating')}>
                  Rating {sortConfig.field === 'rating' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(player => (
                <tr key={player.id}>
                  <td className="text-center">{player.name}</td>
                  <td className="text-center">{player.position}</td>
                  <td className="text-center">{player.year}</td>
                  <td className="text-center">{player.rating}</td>
                  <td className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button onClick={() => startEditing(player)} size="sm">Edit</Button>
                      <Button onClick={() => removePlayer(player.id)} variant="destructive" size="sm">Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roster;