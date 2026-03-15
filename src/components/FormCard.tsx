import React, { useState } from 'react';
import { FormDefinition } from '../types';
import { FileText, MoreVertical, Eye, BarChart2, Trash2, Copy, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FormCardProps {
  form: FormDefinition;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onSubmissions: (id: string) => void;
}

const FormCard: React.FC<FormCardProps> = ({ form, onDelete, onEdit, onView, onSubmissions }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 hover:shadow-md transition-all group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
          <FileText size={24} />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-black/40 hover:text-black/80 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-black/5 rounded-xl shadow-xl z-10 py-2 overflow-hidden">
              <button 
                onClick={() => { onEdit(form.id!); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 flex items-center gap-2"
              >
                <FileText size={16} /> Edit Form
              </button>
              <button 
                onClick={() => { onSubmissions(form.id!); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 flex items-center gap-2"
              >
                <BarChart2 size={16} /> View Submissions
              </button>
              <button 
                onClick={() => { onView(form.id!); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 flex items-center gap-2"
              >
                <Eye size={16} /> Preview
              </button>
              <div className="border-t border-black/5 my-1"></div>
              <button 
                onClick={() => { onDelete(form.id!); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-lg mb-1 truncate">{form.title}</h3>
      <p className="text-sm text-black/50 mb-4 line-clamp-2 min-h-[40px]">
        {form.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
        <span className="text-xs text-black/40">
          Updated {formatDistanceToNow(form.updatedAt?.toDate() || new Date())} ago
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => onView(form.id!)}
            className="p-2 bg-black/5 rounded-lg text-black/60 hover:bg-black/10 transition-colors"
            title="Preview"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onSubmissions(form.id!)}
            className="p-2 bg-black/5 rounded-lg text-black/60 hover:bg-black/10 transition-colors"
            title="Submissions"
          >
            <BarChart2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormCard;
