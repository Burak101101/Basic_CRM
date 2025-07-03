'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { OpportunityAIResponse, OpportunityProposal } from '@/services/aiService';
import { useRouter } from 'next/navigation';

interface OpportunityProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: OpportunityAIResponse | null;
  companyId?: number;
  contactId?: number;
}

export default function OpportunityProposalModal({
  isOpen,
  onClose,
  proposals,
  companyId,
  contactId
}: OpportunityProposalModalProps) {
  const router = useRouter();
  const [selectedProposals, setSelectedProposals] = useState<Set<number>>(new Set());

  const toggleProposal = (index: number) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProposals(newSelected);
  };

  const handleCreateOpportunities = () => {
    if (selectedProposals.size === 0) return;

    // Store selected proposals in sessionStorage for the opportunity creation page
    const selectedData = Array.from(selectedProposals).map(index => 
      proposals?.opportunities[index]
    ).filter(Boolean);

    sessionStorage.setItem('aiOpportunityProposals', JSON.stringify(selectedData));
    
    // Navigate to opportunity creation page
    const params = new URLSearchParams();
    if (companyId) params.set('company', companyId.toString());
    if (contactId) params.set('contact', contactId.toString());
    
    router.push(`/opportunities/new?${params.toString()}`);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'critical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      case 'critical':
        return 'Kritik';
      default:
        return priority;
    }
  };

  if (!proposals) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    AI Fırsat Önerileri
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* AI Analysis */}
                {proposals.analysis && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">AI Analizi</h4>
                    <p className="text-sm text-blue-800">{proposals.analysis}</p>
                  </div>
                )}

                {/* Opportunity Proposals */}
                <div className="space-y-4 mb-6">
                  {proposals.opportunities.map((proposal, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProposals.has(index)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProposal(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {proposal.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(proposal.priority)}`}>
                              {getPriorityText(proposal.priority)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {proposal.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Tahmini Değer:</span> {proposal.estimated_value.toLocaleString('tr-TR')} TL
                            </div>
                          </div>
                          
                          {proposal.reasoning && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Gerekçe:</span> {proposal.reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProposals.has(index)
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedProposals.has(index) && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {selectedProposals.size} fırsat seçildi
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCreateOpportunities}
                      disabled={selectedProposals.size === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Seçili Fırsatları Oluştur
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
