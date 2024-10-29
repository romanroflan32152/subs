import { render, fireEvent, screen } from '@testing-library/react';
import SubscriptionItem from '../components/SubscriptionItem';
import '@testing-library/jest-dom';
import { Edit2, Trash2 } from 'lucide-react';

// Mock next/image since it's not available in the test environment
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Edit2: () => <span>edit</span>,
  Trash2: () => <span>trash</span>,
}));

describe('SubscriptionItem', () => {
  const mockSubscription = {
    id: 1,
    name: 'Netflix',
    url: 'https://netflix.com',
    price: 15.99,
    icon: 'https://netflix.com/icon.png',
  };

  const mockOnRemove = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders subscription details correctly', () => {
    render(
      <SubscriptionItem
        subscription={mockSubscription}
        onRemove={mockOnRemove}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('$15.99/mo')).toBeInTheDocument();
    expect(screen.getByText('Visit site')).toBeInTheDocument();
  });

  it('calls onRemove when delete button is clicked', () => {
    render(
      <SubscriptionItem
        subscription={mockSubscription}
        onRemove={mockOnRemove}
        onEdit={mockOnEdit}
      />
    );

    const deleteButton = screen.getByText('trash').parentElement;
    fireEvent.click(deleteButton!);

    expect(mockOnRemove).toHaveBeenCalledWith(mockSubscription.id);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <SubscriptionItem
        subscription={mockSubscription}
        onRemove={mockOnRemove}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('edit').parentElement;
    fireEvent.click(editButton!);

    expect(mockOnEdit).toHaveBeenCalledWith(mockSubscription);
  });
});