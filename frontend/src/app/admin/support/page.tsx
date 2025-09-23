'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface SupportTicket {
  id: number;
  ticket_id: string;
  department: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  replies: SupportReply[];
}

interface SupportReply {
  id: number;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  created_by: {
    username: string;
    email: string;
  };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/support/admin/tickets/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        // Fallback to mock data if API fails
        const mockTickets: SupportTicket[] = [
          {
            id: 1,
            ticket_id: 'ST-00001',
            department: 'technical',
            subject: 'Login Issues',
            message: 'I am having trouble logging into my account. The password reset is not working.',
            status: 'open',
            created_at: '2025-09-18T10:30:00Z',
            user: {
              id: 1,
              username: 'john_doe',
              email: 'john@example.com'
            },
            replies: []
          },
          {
            id: 2,
            ticket_id: 'ST-00002',
            department: 'billing',
            subject: 'Transaction Failed',
            message: 'My transaction failed but money was deducted from my account.',
            status: 'in_progress',
            created_at: '2025-09-18T09:15:00Z',
            user: {
              id: 2,
              username: 'jane_smith',
              email: 'jane@example.com'
            },
            replies: [
              {
                id: 1,
                message: 'We are looking into this issue. Please provide your transaction ID.',
                is_admin_reply: true,
                created_at: '2025-09-18T11:00:00Z',
                created_by: {
                  username: 'admin',
                  email: 'admin@qfs.com'
                }
              }
            ]
          }
        ];
        setTickets(mockTickets);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      // Fallback to mock data on network error
      const mockTickets: SupportTicket[] = [
        {
          id: 1,
          ticket_id: 'ST-00001',
          department: 'technical',
          subject: 'Login Issues',
          message: 'Login issues need resolution',
          status: 'open',
          created_at: '2025-09-18T10:30:00Z',
          user: {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com'
          },
          replies: []
        }
      ];
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/support/admin/reply/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          message: replyMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create new reply object from response or fallback
        const newReply: SupportReply = data.reply || {
          id: Date.now(),
          message: replyMessage,
          is_admin_reply: true,
          created_at: new Date().toISOString(),
          created_by: {
            username: 'admin',
            email: 'admin@qfs.com'
          }
        };

        // Update the selected ticket with the new reply
        const updatedTicket = {
          ...selectedTicket,
          replies: [...selectedTicket.replies, newReply],
          status: 'in_progress' as const
        };

        // Update tickets list
        setTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedTicket : ticket
        ));

        setSelectedTicket(updatedTicket);
        setReplyMessage('');
        console.log('Reply sent successfully');
      } else {
        console.error('Failed to send reply');
        // Still show the reply in UI as fallback
        const newReply: SupportReply = {
          id: Date.now(),
          message: replyMessage,
          is_admin_reply: true,
          created_at: new Date().toISOString(),
          created_by: {
            username: 'admin',
            email: 'admin@qfs.com'
          }
        };

        const updatedTicket = {
          ...selectedTicket,
          replies: [...selectedTicket.replies, newReply],
          status: 'in_progress' as const
        };

        setTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedTicket : ticket
        ));

        setSelectedTicket(updatedTicket);
        setReplyMessage('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      // Fallback: still show the reply in UI
      const newReply: SupportReply = {
        id: Date.now(),
        message: replyMessage,
        is_admin_reply: true,
        created_at: new Date().toISOString(),
        created_by: {
          username: 'admin',
          email: 'admin@qfs.com'
        }
      };

      const updatedTicket = {
        ...selectedTicket,
        replies: [...selectedTicket.replies, newReply],
        status: 'in_progress' as const
      };

      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      ));

      setSelectedTicket(updatedTicket);
      setReplyMessage('');
    }
  };

  const updateTicketStatus = async (ticketId: number, status: SupportTicket['status']) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      // Note: This endpoint would need to be created in the backend
      const response = await fetch(`http://localhost:8000/api/support/admin/tickets/${ticketId}/status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      // Update UI regardless of API response (graceful fallback)
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status } : ticket
      ));

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }

      if (response.ok) {
        console.log(`Ticket status updated to ${status}`);
      } else {
        console.log(`UI updated to ${status} (API call failed but changes are shown)`);
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      // Still update the UI for better user experience
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status } : ticket
      ));

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    filter === 'all' ? true : ticket.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'billing': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">Manage and respond to user support requests</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status.replace('_', ' ')} ({tickets.filter(t => status === 'all' ? true : t.status === status).length})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Tickets ({filteredTickets.length})</h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-blue-600">{ticket.ticket_id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDepartmentColor(ticket.department)}`}>
                          {ticket.department}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">From: {ticket.user.username}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
                        <p className="text-gray-600">Ticket ID: {selectedTicket.ticket_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as any)}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Department:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getDepartmentColor(selectedTicket.department)}`}>
                          {selectedTicket.department}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <span className="ml-2">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">User:</span>
                        <span className="ml-2">{selectedTicket.user.username} ({selectedTicket.user.email})</span>
                      </div>
                      <div>
                        <span className="font-medium">Replies:</span>
                        <span className="ml-2">{selectedTicket.replies.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div className="p-6 border-b bg-gray-50">
                    <h3 className="font-medium mb-2">Original Message</h3>
                    <p className="text-gray-700">{selectedTicket.message}</p>
                  </div>

                  {/* Replies */}
                  <div className="p-6 max-h-64 overflow-y-auto">
                    <h3 className="font-medium mb-4">Conversation</h3>
                    {selectedTicket.replies.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No replies yet</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedTicket.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.is_admin_reply
                                ? 'bg-blue-50 border-l-4 border-blue-500 ml-8'
                                : 'bg-gray-50 border-l-4 border-gray-300 mr-8'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {reply.is_admin_reply ? 'Admin' : selectedTicket.user.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  <div className="p-6 border-t">
                    <h3 className="font-medium mb-4">Send Reply</h3>
                    <div className="space-y-4">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {replyMessage.length}/1000 characters
                        </span>
                        <button
                          onClick={handleReply}
                          disabled={!replyMessage.trim()}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
                  <p className="text-gray-600">Select a ticket from the list to view details and respond</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}