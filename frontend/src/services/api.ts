/**
 * @file api.ts
 * @description Centralized API service for handling all network requests to the backend.
 * Uses Axios with interceptors for authentication and global error handling.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

/**
 * Singleton service class for backend communication.
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Request Interceptor:
     * Automatically attaches the JWT 'token' from localStorage to every outgoing request.
     */
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    /**
     * Response Interceptor:
     * Handles global errors, specifically 401 Unauthorized which triggers a logout.
     */
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear session and redirect to login if token is invalid/expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  /**
   * Registers a new user account.
   */
  async register(data: { fullName: string; email: string; phone: string; password: string; nin: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  /**
   * authenticates a user and returns a JWT.
   */
  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  /**
   * Fetches the profile of the currently logged-in user.
   */
  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // ==========================================
  // AUTHENTICATION & VERIFICATION
  // ==========================================

  /**
   * Triggers an OTP transmission to the user's available channels.
   */
  async sendOtp(channel: 'EMAIL' | 'PHONE') {
    const response = await this.client.post('/auth/send-otp', { channel });
    return response.data;
  }

  /**
   * Verifies an Identity token OTP.
   */
  async verifyOtp(code: string, channel: 'EMAIL' | 'PHONE') {
    const response = await this.client.post('/auth/verify-otp', { code, channel });
    return response.data;
  }
  // EXAM MANAGEMENT
  // ==========================================

  /**
   * Retrieves all active exams (User-facing).
   */
  async getExams() {
    const response = await this.client.get('/exams');
    return response.data;
  }

  /**
   * Retrieves a single exam by ID (User-facing).
   */
  async getExam(id: string) {
    const response = await this.client.get(`/exams/${id}`);
    return response.data;
  }

  /**
   * Creates a new exam (Admin-only).
   */
  async createExam(data: any) {
    const response = await this.client.post('/exams', data);
    return response.data;
  }

  /**
   * Updates an existing exam (Admin-only).
   */
  async updateExam(id: string, data: any) {
    const response = await this.client.put(`/exams/${id}`, data);
    return response.data;
  }

  /**
   * Deletes an exam from the system (Admin-only).
   */
  async deleteExam(id: string) {
    const response = await this.client.delete(`/exams/${id}`);
    return response.data;
  }

  // ==========================================
  // EXAM ATTEMPTS
  // ==========================================

  /**
   * Initializes a new exam session.
   */
  async startAttempt(examId: string) {
    const response = await this.client.post('/attempts/start', { examId });
    return response.data;
  }

  /**
   * Saves partial progress for a specific question.
   */
  async saveAnswer(data: {
    attemptId: string;
    questionId: string;
    selectedOptionId?: string | null;
    textAnswer?: string | null;
    wordCount?: number;
    timeSpent?: number;
    wpm?: number;
    pasteCount?: number;
  }) {
    const response = await this.client.post('/attempts/save-answer', data);
    return response.data;
  }

  /**
   * Submits the attempt for final evaluation.
   */
  async submitAttempt(attemptId: string) {
    const response = await this.client.post('/attempts/submit', { attemptId });
    return response.data;
  }

  /**
   * Retrieves a list of all tests taken by the user.
   */
  async getMyAttempts() {
    const response = await this.client.get('/attempts/my-attempts');
    return response.data;
  }

  /**
   * Fetches detailed metrics for a specific attempt.
   */
  async getAttemptDetails(id: string) {
    const response = await this.client.get(`/attempts/${id}`);
    return response.data;
  }

  /**
   * Logs a paste event for proctoring.
   */
  async trackPaste(attemptId: string) {
    const response = await this.client.post('/attempts/track-paste', { attemptId });
    return response.data;
  }

  /**
   * Logs a tab switch event for proctoring.
   */
  async trackTabSwitch(attemptId: string) {
    const response = await this.client.post('/attempts/track-tab-switch', { attemptId });
    return response.data;
  }

  // ==========================================
  // ANNOTATOR DASHBOARD & ANALYTICS
  // ==========================================

  /**
   * Retrieves summary statistics for the user dashboard.
   */
  async getDashboardStats() {
    const response = await this.client.get('/annotator/stats');
    return response.data;
  }

  /**
   * Retrieves a history of all scores.
   */
  async getMyScores() {
    const response = await this.client.get('/annotator/scores');
    return response.data;
  }

  /**
   * Retrieves a single result breakdown by score ID.
   */
  async getScoreDetails(id: string) {
    const response = await this.client.get(`/annotator/scores/${id}`);
    return response.data;
  }

  // ==========================================
  // ADMINISTRATIVE ACTIONS
  // ==========================================

  /**
   * Retrieves a list of all users in the system.
   */
  async getAllUsers() {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  /**
   * Retrieves full profile and test history for a specific user.
   */
  async getUserDetails(id: string) {
    const response = await this.client.get(`/admin/users/${id}`);
    return response.data;
  }

  /**
   * Resets a user's attempt counts for all exams.
   */
  async resetAttempts(userId: string) {
    const response = await this.client.post('/admin/reset-attempts', { userId });
    return response.data;
  }

  /**
   * Directly modifies a user's eligibility status.
   */
  async updateUserStatus(userId: string, status: 'ELIGIBLE' | 'DISQUALIFIED') {
    const response = await this.client.post('/admin/update-status', { userId, status });
    return response.data;
  }

  /**
   * Fetches all global plagiarism incident reports.
   */
  async getPlagiarismReports() {
    const response = await this.client.get('/admin/plagiarism-reports');
    return response.data;
  }

  /**
   * Fetches high-level usage and performance analytics for the platform.
   */
  async getAnalytics() {
    const response = await this.client.get('/admin/analytics');
    return response.data;
  }

  /**
   * Fetches the audit log of all admin actions.
   */
  async getAdminActions() {
    const response = await this.client.get('/admin/actions');
    return response.data;
  }

  /**
   * Deletes a user from the system.
   */
  async deleteUser(userId: string) {
    const response = await this.client.delete(`/admin/users/${userId}`);
    return response.data;
  }

  // ==========================================
  // NEW FEATURES
  // ==========================================

  /**
   * Retrieves all exams with admin stats (Admin-only).
   */
  async getAllExamsAdmin() {
    const response = await this.client.get('/exams/admin/all');
    return response.data;
  }

  /**
   * Approves a retake for a specific user+exam combo (Admin-only).
   */
  async approveRetake(userId: string, examId: string) {
    const response = await this.client.post('/exams/approve-retake', { userId, examId });
    return response.data;
  }

  /**
   * Uploads an image for use in exam questions/options (Admin-only).
   */
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.client.post('/exams/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /**
   * Updates a question's reference image URL (Admin-only).
   */
  async updateQuestionImage(questionId: string, imageUrl: string) {
    const response = await this.client.patch(`/exams/questions/${questionId}/image`, { imageUrl });
    return response.data;
  }

  /**
   * Manually verify a user's identity (Admin-only).
   */
  async adminVerifyUser(userId: string) {
    const response = await this.client.post('/admin/verify-user', { userId });
    return response.data;
  }

  /**
   * Downloads qualified users as Excel file.
   */
  async exportQualifiedUsers() {
    const response = await this.client.get('/admin/export-qualified', {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Downloads disqualified users as Excel file.
   */
  async exportDisqualifiedUsers() {
    const response = await this.client.get('/admin/export-disqualified', {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Retrieves qualified users list.
   */
  async getQualifiedUsers() {
    const response = await this.client.get('/admin/qualified-users');
    return response.data;
  }

  /**
   * Retrieves disqualified users list.
   */
  async getDisqualifiedUsers() {
    const response = await this.client.get('/admin/disqualified-users');
    return response.data;
  }
}

export const api = new ApiService();

