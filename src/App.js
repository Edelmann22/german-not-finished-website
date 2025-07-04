import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Calendar Component
const Calendar = ({ onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isPastDate = (day) => {
    const today = new Date();
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return cellDate < today;
  };

  const hasAvailableSlots = (day) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    const schedule = scheduleData[dateStr];
    return schedule && schedule.slots.some(slot => slot.is_available);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`p-2 text-center text-sm cursor-pointer rounded ${
              day === null
                ? 'invisible'
                : isPastDate(day)
                ? 'text-gray-400 cursor-not-allowed'
                : isToday(day)
                ? 'bg-blue-500 text-white font-bold'
                : hasAvailableSlots(day)
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              if (day !== null && !isPastDate(day)) {
                const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                onDateSelect(dateStr);
              }
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

// Time Slot Component
const TimeSlotPicker = ({ selectedDate, onSlotSelect }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchSchedule();
    }
  }, [selectedDate]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/schedule/${selectedDate}`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-500">Wählen Sie ein Datum aus dem Kalender</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-500">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Verfügbare Zeiten - {selectedDate}</h3>
      <div className="grid grid-cols-2 gap-3">
        {schedule?.slots.map((slot, index) => (
          <button
            key={index}
            onClick={() => slot.is_available && onSlotSelect(slot.time)}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              slot.is_available
                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                : 'bg-red-100 text-red-800 cursor-not-allowed'
            }`}
            disabled={!slot.is_available}
          >
            {slot.time} {slot.is_available ? '✓' : '✗'}
          </button>
        ))}
      </div>
    </div>
  );
};

// Booking Form Component
const BookingForm = ({ selectedDate, selectedTime, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_phone: '',
    level: 'beginner',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date: selectedDate,
      time_slot: selectedTime
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
        <h2 className="text-2xl font-bold mb-6">Unterrichtsstunde buchen</h2>
        <p className="text-gray-600 mb-4">
          Datum: {selectedDate} um {selectedTime}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vollständiger Name*
            </label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail*
            </label>
            <input
              type="email"
              name="student_email"
              value={formData.student_email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon*
            </label>
            <input
              type="tel"
              name="student_phone"
              value={formData.student_phone}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ihr Deutschniveau
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="beginner">Anfänger (A1-A2)</option>
              <option value="intermediate">Mittelstufe (B1-B2)</option>
              <option value="advanced">Fortgeschritten (C1-C2)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nachricht (optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Besondere Wünsche oder Fragen..."
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buchen
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('startseite');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetchCourseInfo();
    fetchTestimonials();
  }, []);

  const fetchCourseInfo = async () => {
    try {
      const response = await axios.get(`${API}/course-info`);
      setCourseInfo(response.data);
    } catch (error) {
      console.error('Error fetching course info:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API}/testimonials`);
      setTestimonials(response.data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const handleSlotSelect = (time) => {
    setSelectedTime(time);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      await axios.post(`${API}/booking`, bookingData);
      alert('Buchung erfolgreich! Sie erhalten eine Bestätigungs-E-Mail.');
      setShowBookingForm(false);
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (error) {
      alert('Fehler bei der Buchung. Versuchen Sie es später erneut.');
      console.error('Error booking:', error);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-blue-600">Научете немски</span>
            </div>
            <div className="flex tab-buttons">
              <button
                onClick={() => setActiveTab('startseite')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'startseite' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-green-600 hover:bg-blue-50'
                }`}
              >
                Начало
              </button>
              <button
                onClick={() => setActiveTab('terminplaner')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'terminplaner' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                График
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Информация
              </button>
              <button
                onClick={() => setActiveTab('preise')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'preise' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Цени
              </button>
              <button
                onClick={() => setActiveTab('bewertungen')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'bewertungen' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Оценки
              </button>
              <button onClick={() => setActiveTab('bewertungen')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'bewertungen' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}>
                DE
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-10">
        {activeTab === 'startseite' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-center">
              <div
              style={{background: 'linear-gradient(to bottom,rgb(237, 85, 209),rgb(140, 24, 207))'}}
               className="text-white rounded-2xl p-16 shadow-xl">
                <h1 className="text-5xl font-bold mb-6">
                  Deutsch auf allen Ebenen 
                </h1>
                <p className="text-2xl mb-12 max-w-4xl mx-auto">
                  Deutsch für klein und groß
                </p>
                <p className="text-2xl mb-12 max-w-4xl mx-auto second-p">Deutsch für jung und alt</p>
                <div className="mb-12">
                  <img 
                    src="https://images.unsplash.com/photo-1589395937658-0557e7d89fad" 
                    alt="Deutschunterricht" 
                    className="w-full max-w-2xl mx-auto rounded-xl shadow-2xl"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('terminplaner')}
                  className="bg-white text-blue-600 px-12 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Запазете час за урок
                </button>
              </div>
            </section>

            {/* Quick Overview */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Защо да учите немски с мен?</h2>
                <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                  Немският език е високо ценен в много сфери. Може да ви помогне както професионално, така и лично – за по-добри възможности за работа, учене в Германия или свободно пътуване. Немският отваря врати към нови култури, приятелства и успешна интеграция в немскоговорящи страни.
                </p>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="text-center p-8 bg-blue-50 rounded-xl">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-4">Индивидуално обучение</h3>
                  <p className="text-gray-600">Частните уроци дават възможност за самостоятелно развитие и постигане на високо ниво.</p>
                </div>
                <div className="text-center p-8 bg-green-50 rounded-xl">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold mb-4">Подготовка за изпит</h3>
                  <p className="text-gray-600">Множество доволни ученици и добри резултати.</p>
                </div>
                <div className="text-center p-8 bg-purple-50 rounded-xl">
                  <div className="text-5xl mb-4">📍</div>
                  <h3 className="text-2xl font-bold mb-4">Местоположение</h3>
                  <p className="text-gray-600">Уроците може да бъдат <a className='text-name underline' href='https://maps.app.goo.gl/mUao1rpvkHxEANxy8' target='_blank'>на място</a> или онлайн.</p>
                </div>
                <div className="text-center p-8 bg-purple-50 rounded-xl">
                  <div className="text-5xl mb-4">📍</div>
                  <h3 className="text-2xl font-bold mb-4">Групово обучение</h3>
                  
                </div>
                <div className="text-center p-8 bg-green-50 rounded-xl">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold mb-4">Езикови игри</h3>
                  <p className="text-gray-600">Множество доволни ученици и добри резултати.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'terminplaner' && (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6">Terminplaner</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wählen Sie ein Datum und eine verfügbare Zeit für Ihren Deutschunterricht
              </p>
            </div>
            
            <div className="grid xl:grid-cols-2 gap-12">
              <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
              <TimeSlotPicker selectedDate={selectedDate} onSlotSelect={handleSlotSelect} />
            </div>
          </div>
        )}

        {activeTab === 'info' && courseInfo && (
          <div className="space-y-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6">Über uns</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Lernen Sie mehr über unsere Lehrerin und unsere Unterrichtsmethoden
              </p>
            </div>

            {/* Teacher Section */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <img 
                    src="https://images.pexels.com/photos/5124910/pexels-photo-5124910.jpeg" 
                    alt="Lehrerin" 
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-6">Über {courseInfo.teacher_name}</h2>
                  <p className="text-xl text-gray-600 mb-8">{courseInfo.teacher_bio}</p>
                  <div className="space-y-4">
                    {courseInfo.teacher_experience.split('•').filter(exp => exp.trim()).map((exp, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-6 h-6 text-green-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-lg">{exp.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Teaching Method */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <h2 className="text-3xl font-bold text-center mb-12">Unsere Unterrichtsmethode</h2>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="text-center p-8 bg-blue-50 rounded-xl">
                  <div className="text-4xl mb-6">📚</div>
                  <h3 className="text-2xl font-bold mb-4">Strukturiert</h3>
                  <p className="text-gray-600">Systematischer Aufbau von Grundlagen bis zur Perfektion mit bewährten Lehrmethoden.</p>
                </div>
                <div className="text-center p-8 bg-green-50 rounded-xl">
                  <div className="text-4xl mb-6">🗣️</div>
                  <h3 className="text-2xl font-bold mb-4">Kommunikativ</h3>
                  <p className="text-gray-600">Fokus auf aktive Kommunikation und praktische Anwendung im Alltag.</p>
                </div>
                <div className="text-center p-8 bg-purple-50 rounded-xl">
                  <div className="text-4xl mb-6">🎯</div>
                  <h3 className="text-2xl font-bold mb-4">Individuell</h3>
                  <p className="text-gray-600">Angepasst an Ihr Lerntempo und Ihre persönlichen Ziele.</p>
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <h2 className="text-3xl font-bold text-center mb-12">Unser Standort</h2>
              <div className="text-center">
                <div className="text-6xl mb-8">📍</div>
                <h3 className="text-2xl font-bold mb-4">{courseInfo.location}</h3>
                <p className="text-xl text-gray-600 mb-8">
                  Zentral gelegen mit hervorragender Anbindung an öffentliche Verkehrsmittel
                </p>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h4 className="text-xl font-bold mb-2">Öffentliche Verkehrsmittel</h4>
                    <p className="text-gray-600">U-Bahn: Universität (U3, U6)<br/>Bus: Verschiedene Linien</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl">
                    <h4 className="text-xl font-bold mb-2">Parkmöglichkeiten</h4>
                    <p className="text-gray-600">Parkplätze in der Nähe<br/>Tiefgarage verfügbar</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'preise' && courseInfo && (
          <div className="space-y-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6">Preise & Pakete</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Faire und transparente Preise für qualitativ hochwertigen Deutschunterricht
              </p>
            </div>

            {/* Pricing Cards */}
            <section className="grid lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
                <div className="text-5xl mb-6">⭐</div>
                <h3 className="text-2xl font-bold mb-4">Einzelstunde</h3>
                <p className="text-5xl font-bold text-blue-600 mb-4">€{courseInfo.price_per_hour}</p>
                <p className="text-gray-600 mb-8">pro Stunde</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    60 Minuten Unterricht
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Individuelle Betreuung
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Flexible Terminwahl
                  </li>
                </ul>
                <button
                  onClick={() => setActiveTab('terminplaner')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Jetzt buchen
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-10 text-center transform scale-105 border-4 border-yellow-400">
                <div className="text-5xl mb-6">🏆</div>
                <h3 className="text-2xl font-bold mb-4">5er-Paket</h3>
                <p className="text-5xl font-bold mb-2">€{(courseInfo.price_per_hour * 5 * 0.9).toFixed(0)}</p>
                <p className="text-lg mb-2">statt €{courseInfo.price_per_hour * 5}</p>
                <p className="text-yellow-300 font-bold mb-8">10% Ersparnis</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    5 x 60 Minuten
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Kostenloses Lehrmaterial
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Fortschrittsverfolgung
                  </li>
                </ul>
                <button
                  onClick={() => setActiveTab('terminplaner')}
                  className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Beliebteste Wahl
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
                <div className="text-5xl mb-6">🎓</div>
                <h3 className="text-2xl font-bold mb-4">10er-Paket</h3>
                <p className="text-5xl font-bold text-blue-600 mb-2">€{(courseInfo.price_per_hour * 10 * 0.85).toFixed(0)}</p>
                <p className="text-lg mb-2">statt €{courseInfo.price_per_hour * 10}</p>
                <p className="text-green-600 font-bold mb-8">15% Ersparnis</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    10 x 60 Minuten
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Prüfungsvorbereitung
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Zertifikat inklusive
                  </li>
                </ul>
                <button
                  onClick={() => setActiveTab('terminplaner')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Jetzt buchen
                </button>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <h2 className="text-3xl font-bold text-center mb-12">Kontakt & Bezahlung</h2>
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Kontaktdaten</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-lg">{courseInfo.contact_phone}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-lg">{courseInfo.contact_email}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg">{courseInfo.location}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-6">Zahlungsmöglichkeiten</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-600 mr-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">Barzahlung</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-600 mr-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">Banküberweisung</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-600 mr-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">PayPal</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'bewertungen' && (
          <div className="space-y-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6">Bewertungen</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Was unsere Schüler über den Deutschunterricht sagen
              </p>
            </div>

            {/* Rating Overview */}
            <section className="bg-white rounded-2xl shadow-xl p-12">
              <div className="text-center mb-12">
                <div className="text-7xl font-bold text-blue-600 mb-4">5.0</div>
                <div className="text-3xl text-yellow-500 mb-4">★★★★★</div>
                <p className="text-xl text-gray-600">Basierend auf {testimonials.length} Bewertungen</p>
              </div>
              
              <div className="grid md:grid-cols-5 gap-6 text-center">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">5★</div>
                  <div className="text-sm text-gray-600">Ausgezeichnet</div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Zufriedenheit</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Schüler</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">15</div>
                  <div className="text-sm text-gray-600">Jahre</div>
                </div>
                <div className="bg-red-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">95%</div>
                  <div className="text-sm text-gray-600">Prüfungsrate</div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="grid lg:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.student_name[0]}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-xl font-bold">{testimonial.student_name}</h4>
                      <div className="text-2xl text-yellow-500">{renderStars(testimonial.rating)}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg italic mb-6">"{testimonial.comment}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Niveau: {testimonial.level_achieved === 'beginner' ? 'Anfänger' : 
                              testimonial.level_achieved === 'intermediate' ? 'Mittelstufe' : 'Fortgeschritten'}
                    </span>
                    <span className="text-sm text-gray-500">{testimonial.date}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-12 text-center">
              <h2 className="text-4xl font-bold mb-6">Werden Sie unser nächster Erfolg!</h2>
              <p className="text-xl mb-10 max-w-3xl mx-auto">
                Schließen Sie sich unseren zufriedenen Schülern an und erreichen Sie Ihre Deutschziele mit individueller Betreuung.
              </p>
              <button
                onClick={() => setActiveTab('terminplaner')}
                className="bg-white text-blue-600 px-12 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Jetzt kostenloses Beratungsgespräch buchen
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSubmit={handleBookingSubmit}
          onCancel={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}

export default App;