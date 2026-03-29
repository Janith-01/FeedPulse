import mongoose, { Schema, Document } from 'mongoose';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface IFeedback extends Document {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Email Validator ─────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Schema ──────────────────────────────────────────────────────────────────

const FeedbackSchema: Schema = new Schema<IFeedback>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ['Bug', 'Feature Request', 'Improvement', 'Other'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'In Review', 'Resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'New',
    },
    submitterName: {
      type: String,
      trim: true,
    },
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value: string) {
          if (!value) return true; // optional field
          return emailRegex.test(value);
        },
        message: '{VALUE} is not a valid email address',
      },
    },

    // ─── AI-Populated Fields ───────────────────────────────────────────

    ai_category: {
      type: String,
      trim: true,
    },
    ai_sentiment: {
      type: String,
      enum: {
        values: ['Positive', 'Neutral', 'Negative'],
        message: '{VALUE} is not a valid sentiment',
      },
    },
    ai_priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [10, 'Priority cannot exceed 10'],
    },
    ai_summary: {
      type: String,
      trim: true,
    },
    ai_tags: {
      type: [String],
      default: [],
    },
    ai_processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ ai_priority: 1 });
FeedbackSchema.index({ createdAt: -1 });

// ─── Model Export ────────────────────────────────────────────────────────────

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
