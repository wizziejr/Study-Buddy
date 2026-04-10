import { BookOpen, Brain, Clock, Plus, Target, Flame } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="greeting">Welcome back, Aqua! 👋</h2>
          <p className="subtitle">You're on a 5-day study streak. Keep it up!</p>
        </div>
        <button className="glass-button primary">
          <Plus size={18} /> Upload Notes
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <Flame size={24} className="icon-burn" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Current Streak</p>
            <h3 className="stat-value">5 Days</h3>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <BookOpen size={24} className="icon-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Notes Uploaded</p>
            <h3 className="stat-value">12</h3>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <Target size={24} className="icon-green" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Quizzes Completed</p>
            <h3 className="stat-value">8</h3>
          </div>
        </div>
        <div className="stat-card glass-panel activate-ai">
          <div className="icon-wrapper">
            <Brain size={24} className="icon-purple" />
          </div>
          <div className="stat-info">
            <p className="stat-label">AI Interactions</p>
            <h3 className="stat-value">45</h3>
          </div>
          <button className="glass-button primary mt-2 w-full text-sm">Open AI Tutor</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-section glass-panel">
          <h3 className="section-title">Recent Activity</h3>
          <ul className="activity-list">
            <li className="activity-item">
              <div className="activity-icon bg-blue"><BookOpen size={16} /></div>
              <div className="activity-text">
                <p>Reviewed <strong>MSCE Mathematics 2023</strong></p>
                <span>2 hours ago</span>
              </div>
            </li>
            <li className="activity-item">
              <div className="activity-icon bg-purple"><Brain size={16} /></div>
              <div className="activity-text">
                <p>Asked AI Tutor about <strong>Photosynthesis</strong></p>
                <span>5 hours ago</span>
              </div>
            </li>
            <li className="activity-item">
              <div className="activity-icon bg-green"><Clock size={16} /></div>
              <div className="activity-text">
                <p>Completed Quiz: <strong>Physics Form 4</strong> (90%)</p>
                <span>1 day ago</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="recommended-section glass-panel">
          <h3 className="section-title">Recommended for You</h3>
          <div className="card-list">
            <div className="resource-card">
              <div className="resource-thumb"></div>
              <h4>Biology MSCE Notes</h4>
              <p>Form 4 • 2.4k Views</p>
            </div>
            <div className="resource-card">
              <div className="resource-thumb var-2"></div>
              <h4>English Past Paper '21</h4>
              <p>Form 4 • 1.1k Views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
