import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EntryCard from './EntryCard';
import { SettingsProvider } from '../context/SettingsContext';

const mockTheme = {
  cardBackground: '#FFFFFF',
  text: '#000000',
  textCompleted: '#888888',
  textSecondary: '#666666',
  inputBackground: '#F0F0F0',
  primary: '#007AFF',
  error: '#FF3B30',
};

const mockItem = {
  id: 'e1',
  text: 'Comprar fruta',
  type: 'task',
  status: 'open',
  signifier: 'priority',
  time: '10:30',
  date: '2026-09-22',
};

const renderCard = async (props = {}) => {
  return await render(
    <SettingsProvider>
      <EntryCard
        item={mockItem}
        theme={mockTheme}
        language="es"
        todayStr="2026-09-22"
        currentLogDateStr="2026-09-22"
        {...props}
      />
    </SettingsProvider>
  );
};

describe('EntryCard Component', () => {
  it('renders entry text and time correctly', async () => {
    const { getByText } = await renderCard();

    expect(getByText('Comprar fruta')).toBeTruthy();
    expect(getByText('10:30')).toBeTruthy();
    expect(getByText('*')).toBeTruthy();
  });

  it('triggers onToggleStatus when card content is pressed', async () => {
    const onToggleStatus = jest.fn();
    const { getByText } = await renderCard({ onToggleStatus });

    fireEvent.press(getByText('Comprar fruta'));
    expect(onToggleStatus).toHaveBeenCalledWith('e1', '2026-09-22');
  });

  it('triggers onDelete when delete icon button is pressed', async () => {
    const onDelete = jest.fn();
    const { getByLabelText } = await renderCard({ onDelete });

    fireEvent.press(getByLabelText('Eliminar'));
    expect(onDelete).toHaveBeenCalledWith('e1');
  });

  it('triggers onToggleSignifier when signifier icon container is pressed', async () => {
    const onToggleSignifier = jest.fn();
    const { getByText } = await renderCard({ onToggleSignifier });

    fireEvent.press(getByText('*'));
    expect(onToggleSignifier).toHaveBeenCalledWith('e1');
  });
});
