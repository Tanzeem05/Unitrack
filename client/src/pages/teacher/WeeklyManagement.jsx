import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function WeeklyManagement({ courseId }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingWeek, setEditingWeek] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [editForm, setEditForm] = useState({
    topic_title: '',
    topic_description: '',
    learning_objectives: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoading(true);
        const data = await api(`/course-weeks/course/${courseId}/weeks`);
        setWeeks(data || []);
      } catch (err) {
        console.error('Failed to fetch course weeks:', err);
        setError('Failed to load weekly schedule.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchWeeks();
    }
  }, [courseId]);

  const handleEdit = (week) => {
    const status = getWeekStatus(week);
    
    if (status === 'completed') {
      setError('Cannot edit completed weeks.');
      return;
    }
    
    setEditingWeek(week.week_id);
    setEditForm({
      topic_title: week.topic_title || '',
      topic_description: week.topic_description || '',
      learning_objectives: week.learning_objectives || ''
    });
  };

  const handleSave = async () => {
    if (!editForm.topic_title.trim()) {
      setError('Topic title is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updatedWeek = await api(`/course-weeks/weeks/${editingWeek}`, 'PUT', editForm);
      
      setWeeks(prev => prev.map(week => 
        week.week_id === editingWeek ? { ...week, ...updatedWeek } : week
      ));
      
      setEditingWeek(null);
      setEditForm({ topic_title: '', topic_description: '', learning_objectives: '' });
    } catch (err) {
      console.error('Failed to update week:', err);
      setError('Failed to update week content.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingWeek(null);
    setEditForm({ topic_title: '', topic_description: '', learning_objectives: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleWeekExpansion = (weekId) => {
    if (editingWeek) return; // Don't expand while editing
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const getWeekStatus = (week) => {
    const today = new Date();
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    
    if (today < startDate) return 'upcoming';
    if (today >= startDate && today <= endDate) return 'current';
    return 'completed';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-300">Loading weekly schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Weekly Schedule Management</h3>
      </div>

      {weeks.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-300 mb-2">No weekly schedule available.</p>
          <p className="text-gray-400 text-sm">
            Weekly schedule has not been set up for this course yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {weeks.map((week) => {
            const isEditing = editingWeek === week.week_id;
            const isExpanded = expandedWeek === week.week_id;
            const status = getWeekStatus(week);
            const today = new Date();
            const startDate = new Date(week.start_date);
            const endDate = new Date(week.end_date);
            const isCurrentWeek = today >= startDate && today <= endDate;
            
            return (
              <div
                key={week.week_id}
                className={`
                  border rounded-lg transition-all duration-200
                  ${isCurrentWeek 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-700 bg-gray-800'
                  }
                  ${isExpanded && !isEditing ? 'ring-2 ring-blue-400/50' : ''}
                `}
              >
                {/* Week Header - Clickable when not editing */}
                <div 
                  className={`
                    flex items-center justify-between p-4 transition-colors
                    ${!isEditing ? 'cursor-pointer hover:bg-gray-700/30' : ''}
                  `}
                  onClick={() => !isEditing && toggleWeekExpansion(week.week_id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${isCurrentWeek ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'}
                    `}>
                      {week.week_number}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Week {week.week_number}
                        {week.topic_title && (
                          <span className="text-gray-300 font-normal"> - {week.topic_title}</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatDate(week.start_date)} - {formatDate(week.end_date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Status badge */}
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium uppercase tracking-wide
                      ${status === 'current' 
                        ? 'bg-blue-500 text-white' 
                        : status === 'completed' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }
                    `}>
                      {status}
                    </div>
                    
                    {/* Assignment count */}
                    {week.assignments && week.assignments.length > 0 && (
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {week.assignments.length}
                      </div>
                    )}
                    
                    {!isEditing && status !== 'completed' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(week);
                          }}
                          className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        
                        {/* Expand/Collapse icon */}
                        <div className={`
                          transform transition-transform duration-200 text-gray-400
                          ${isExpanded ? 'rotate-180' : ''}
                        `}>
                          ▼
                        </div>
                      </>
                    )}
                    
                    {!isEditing && status === 'completed' && (
                      <>
                        {/* Expand/Collapse icon for completed weeks */}
                        <div className={`
                          transform transition-transform duration-200 text-gray-400
                          ${isExpanded ? 'rotate-180' : ''}
                        `}>
                          ▼
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Week Content */}
                {isEditing ? (
                  // Editing Mode
                  <div className="border-t border-gray-600 p-4 space-y-4 bg-gray-800/30">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Topic Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.topic_title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, topic_title: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter week topic (e.g., Introduction to Variables, Data Structures)..."
                        required
                      />
                      {!editForm.topic_title.trim() && (
                        <p className="text-orange-400 text-xs mt-1">Topic title is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Topic Description
                      </label>
                      <textarea
                        value={editForm.topic_description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, topic_description: e.target.value }))}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Describe what will be covered this week..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Learning Objectives
                        <span className="text-gray-500 text-xs ml-1">(Recommended)</span>
                      </label>
                      <textarea
                        value={editForm.learning_objectives}
                        onChange={(e) => setEditForm(prev => ({ ...prev, learning_objectives: e.target.value }))}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="What should students learn this week? (e.g., By the end of this week, students will be able to...)"
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        💡 Tip: Start with "By the end of this week, students will be able to..."
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isExpanded ? (
                  // Read-only View Mode
                  <div className="border-t border-gray-600 p-4 space-y-4 bg-gray-800/30">
                    {/* Topic Description */}
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h5 className="font-medium text-white mb-2 flex items-center">
                        📚 Topic Description
                      </h5>
                      {week.topic_title || week.topic_description ? (
                        <>
                          {week.topic_title && (
                            <h6 className="font-semibold text-blue-300 mb-1">
                              {week.topic_title}
                            </h6>
                          )}
                          {week.topic_description && (
                            <p className="text-gray-300 text-sm">
                              {week.topic_description}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className={`border-2 border-dashed rounded-lg p-3 ${
                          status === 'completed' 
                            ? 'border-gray-600 bg-gray-800/20' 
                            : 'border-yellow-600 bg-yellow-900/10'
                        }`}>
                          <p className={`text-sm font-medium mb-2 ${
                            status === 'completed' ? 'text-gray-400' : 'text-yellow-400'
                          }`}>
                            {status === 'completed' ? 'Topic not set' : '⚠️ Topic not set yet'}
                          </p>
                          <p className="text-gray-400 text-sm mb-3">
                            {status === 'completed' 
                              ? 'No topic was set for this week.'
                              : 'Set a topic title and description to help students understand what they\'ll learn this week.'
                            }
                          </p>
                          {status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(week);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                            >
                              Set Topic Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Learning Objectives */}
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h6 className="font-medium text-white mb-2 flex items-center">
                        🎯 Learning Objectives
                      </h6>
                      {week.learning_objectives ? (
                        <p className="text-gray-300 text-sm">
                          {week.learning_objectives}
                        </p>
                      ) : (
                        <div className={`border-2 border-dashed rounded-lg p-3 ${
                          status === 'completed' 
                            ? 'border-gray-600 bg-gray-800/20' 
                            : 'border-orange-600 bg-orange-900/10'
                        }`}>
                          <p className={`text-sm font-medium mb-2 ${
                            status === 'completed' ? 'text-gray-400' : 'text-orange-400'
                          }`}>
                            {status === 'completed' ? 'No learning objectives set' : '🎯 No learning objectives set'}
                          </p>
                          <p className="text-gray-400 text-sm mb-3">
                            {status === 'completed' 
                              ? 'No learning objectives were set for this week.'
                              : 'Define clear learning objectives to help students understand what they should achieve this week.'
                            }
                          </p>
                          {status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(week);
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium"
                            >
                              Add Objectives
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Assignments */}
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h6 className="font-medium text-white mb-3 flex items-center">
                        📝 Assignments ({week.assignments?.length || 0})
                      </h6>
                      {week.assignments && week.assignments.length > 0 ? (
                        <div className="space-y-2">
                          {week.assignments.map((assignment) => {
                            const dueDate = new Date(assignment.due_date);
                            const isOverdue = dueDate < new Date();
                            
                            return (
                              <div
                                key={assignment.assignment_id}
                                className={`
                                  p-3 rounded border-l-4 
                                  ${isOverdue 
                                    ? 'bg-red-900/20 border-red-500' 
                                    : 'bg-blue-900/20 border-blue-400'
                                  }
                                `}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h7 className="font-medium text-white">
                                    {assignment.title}
                                  </h7>
                                  <div className="flex flex-col items-end space-y-1">
                                    <span className={`
                                      text-xs px-2 py-1 rounded font-medium
                                      ${isOverdue 
                                        ? 'bg-red-600 text-white' 
                                        : 'bg-blue-600 text-white'
                                      }
                                    `}>
                                      Due: {dueDate.toLocaleDateString()}
                                    </span>
                                    {assignment.max_points && (
                                      <span className="text-xs text-gray-400">
                                        {assignment.max_points} points
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {assignment.description && (
                                  <p className="text-gray-300 text-sm mb-2">
                                    {assignment.description.length > 150 
                                      ? assignment.description.substring(0, 150) + '...'
                                      : assignment.description
                                    }
                                  </p>
                                )}
                                <div className="text-xs text-gray-400">
                                  Assignment #{assignment.assignment_id}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded">
                          <p className="text-gray-400 text-sm">
                            📝 No assignments assigned to this week
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Week Statistics */}
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h6 className="font-medium text-white mb-2 flex items-center">
                        📊 Week Statistics
                      </h6>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className={`ml-2 font-medium ${
                            status === 'current' ? 'text-blue-400' :
                            status === 'completed' ? 'text-green-400' :
                            'text-gray-300'
                          }`}>
                            {status === 'current' ? 'Active' :
                             status === 'completed' ? 'Completed' :
                             'Upcoming'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Assignments:</span>
                          <span className="ml-2 font-medium text-white">
                            {week.assignments?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Week:</span>
                          <span className="ml-2 font-medium text-white">
                            {week.week_number} of {weeks.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
