import { useState, useEffect } from 'react';

export default function WeeklyOverviewDemo({ courseId }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(null);

  useEffect(() => {
    // Mock data for demonstration
    const mockWeeks = [
      {
        week_id: 1,
        week_number: 1,
        start_date: '2025-01-06',
        end_date: '2025-01-12',
        topic_title: 'Introduction to Programming',
        topic_description: 'Basic concepts of programming, variables, and data types',
        learning_objectives: 'Students will understand variables, data types, and basic programming concepts',
        assignments: [
          {
            assignment_id: 1,
            title: 'Hello World Program',
            description: 'Write your first program that displays "Hello World"',
            due_date: '2025-01-10',
            max_points: 10
          }
        ]
      },
      {
        week_id: 2,
        week_number: 2,
        start_date: '2025-01-13',
        end_date: '2025-01-19',
        topic_title: 'Control Structures',
        topic_description: 'Learn about if statements, loops, and decision making in code',
        learning_objectives: 'Students will master conditional statements and loops',
        assignments: [
          {
            assignment_id: 2,
            title: 'Calculator Program',
            description: 'Create a simple calculator using if statements',
            due_date: '2025-01-17',
            max_points: 25
          }
        ]
      },
      {
        week_id: 3,
        week_number: 3,
        start_date: '2025-01-20',
        end_date: '2025-01-26',
        topic_title: 'Functions and Methods',
        topic_description: 'Understanding how to create and use functions to organize code',
        learning_objectives: 'Students will create reusable functions and understand scope',
        assignments: []
      }
    ];
    
    setWeeks(mockWeeks);
  }, [courseId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getWeekStatus = (week) => {
    const today = new Date();
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    
    if (today < startDate) return 'upcoming';
    if (today >= startDate && today <= endDate) return 'current';
    return 'completed';
  };

  const toggleWeekExpansion = (weekId) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const getCurrentWeek = () => {
    const today = new Date();
    return weeks.find(week => {
      const startDate = new Date(week.start_date);
      const endDate = new Date(week.end_date);
      return today >= startDate && today <= endDate;
    })?.week_number || 1;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-300">Loading weekly overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Weekly Overview</h3>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          Currently Week {getCurrentWeek()}
        </span>
      </div>

      <div className="grid gap-4">
        {weeks.map((week) => {
          const status = getWeekStatus(week);
          const isCurrentWeek = week.week_number === getCurrentWeek();
          const isExpanded = expandedWeek === week.week_id;
          
          return (
            <div
              key={week.week_id}
              className={`
                border rounded-lg transition-all duration-200 cursor-pointer
                ${isCurrentWeek 
                  ? 'border-blue-500 bg-blue-900/20 shadow-lg' 
                  : status === 'completed' 
                    ? 'border-gray-600 bg-gray-800/50' 
                    : 'border-gray-700 bg-gray-800'
                }
                ${isExpanded ? 'ring-2 ring-blue-400/50' : ''}
              `}
            >
              {/* Week Header - Clickable */}
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleWeekExpansion(week.week_id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCurrentWeek 
                      ? 'bg-blue-500 text-white' 
                      : status === 'completed' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }
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
                  
                  {/* Assignment count badge */}
                  {week.assignments && week.assignments.length > 0 && (
                    <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {week.assignments.length} assignment{week.assignments.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Expand/Collapse icon */}
                  <div className={`
                    transform transition-transform duration-200 text-gray-400
                    ${isExpanded ? 'rotate-180' : ''}
                  `}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Expanded Week Content */}
              {isExpanded && (
                <div className="border-t border-gray-600 p-4 space-y-4 bg-gray-800/30">
                  {/* Topic and Description */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      📚 Topic Overview
                    </h5>
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
                  </div>

                  {/* Learning Objectives */}
                  {week.learning_objectives && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h6 className="font-medium text-white mb-2 flex items-center">
                        🎯 Learning Objectives
                      </h6>
                      <p className="text-gray-300 text-sm">
                        {week.learning_objectives}
                      </p>
                    </div>
                  )}

                  {/* Assignments */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h6 className="font-medium text-white mb-3 flex items-center">
                      📝 Assignments & Tasks
                    </h6>
                    {week.assignments && week.assignments.length > 0 ? (
                      <div className="space-y-2">
                        {week.assignments.map((assignment) => {
                          const dueDate = new Date(assignment.due_date);
                          const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div
                              key={assignment.assignment_id}
                              className="p-3 rounded border-l-4 bg-blue-900/20 border-blue-400"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h7 className="font-medium text-white">
                                  {assignment.title}
                                </h7>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className="text-xs px-2 py-1 rounded font-medium bg-blue-600 text-white">
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
                                  {assignment.description}
                                </p>
                              )}
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">
                                  Assignment #{assignment.assignment_id}
                                </span>
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                                  View Assignment
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded">
                        <p className="text-gray-400 text-sm">
                          📝 No assignments for this week
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Week Summary */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h6 className="font-medium text-white mb-2 flex items-center">
                      📊 Week Summary
                    </h6>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 font-medium ${
                          status === 'current' ? 'text-blue-400' :
                          status === 'completed' ? 'text-green-400' :
                          'text-gray-300'
                        }`}>
                          {status === 'current' ? 'In Progress' :
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Course Progress */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Course Progress</h4>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(getCurrentWeek() / weeks.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>Week {getCurrentWeek()} of {weeks.length}</span>
          <span>{Math.round((getCurrentWeek() / weeks.length) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );
}
