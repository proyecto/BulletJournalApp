import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchModal from './SearchModal';
import { SettingsProvider } from '../context/SettingsContext';

const mockJournalValue = {
  entries: [
    { id: '1', text: 'Comprar fruta', date: '2026-09-16', type: 'task', status: 'open' },
    { id: '2', text: 'Reunión semanal', date: '2026-09-17', type: 'event', status: 'open' },
  ],
  lists: [],
};

jest.mock('../context/JournalContext', () => ({
  useJournal: () => mockJournalValue,
  getFormattedDate: (d) => '2026-09-16',
}));

const renderSearchModal = async (props = {}) => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSelectResult: jest.fn(),
    ...props,
  };

  const rendered = await render(
    <SettingsProvider>
      <SearchModal {...defaultProps} />
    </SettingsProvider>
  );

  return {
    ...rendered,
    props: defaultProps,
  };
};

describe('SearchModal Component', () => {
  it('renders search input when visible', async () => {
    const { getByPlaceholderText } = await renderSearchModal();
    expect(getByPlaceholderText(/Buscar/i)).toBeTruthy();
  });

  it('filters entries when user types in search input', async () => {
    const { getByPlaceholderText, findByText } = await renderSearchModal();
    const input = getByPlaceholderText(/Buscar/i);

    await act(async () => {
      fireEvent.changeText(input, 'fruta');
    });

    expect(await findByText('Comprar fruta')).toBeTruthy();
  });

  it('calls onSelectResult and onClose when a result item is pressed', async () => {
    const onSelectResult = jest.fn();
    const onClose = jest.fn();

    const { getByPlaceholderText, findByText } = await renderSearchModal({
      onSelectResult,
      onClose,
    });

    const input = getByPlaceholderText(/Buscar/i);
    await act(async () => {
      fireEvent.changeText(input, 'reunión');
    });

    const resultCard = await findByText('Reunión semanal');
    await act(async () => {
      fireEvent.press(resultCard);
    });

    expect(onSelectResult).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
    expect(onClose).toHaveBeenCalled();
  });
});
