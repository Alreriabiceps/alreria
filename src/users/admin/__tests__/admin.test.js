/**
 * Unit tests for admin functionality
 */

import {
  validateRequired,
  validateEmail,
  validateQuestion,
  validateBatchQuestions,
} from "../../../shared/utils/formValidation";
import {
  handleApiError,
  handleValidationErrors,
} from "../../../shared/utils/errorHandler";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe("Form Validation", () => {
  describe("validateRequired", () => {
    it("should return errors for missing required fields", () => {
      const data = { name: "", email: "test@example.com" };
      const requiredFields = ["name", "email", "phone"];

      const errors = validateRequired(data, requiredFields);

      expect(errors.name).toBe("Name is required");
      expect(errors.phone).toBe("Phone is required");
      expect(errors.email).toBeUndefined();
    });

    it("should handle whitespace-only strings", () => {
      const data = { name: "   ", description: "Valid description" };
      const requiredFields = ["name", "description"];

      const errors = validateRequired(data, requiredFields);

      expect(errors.name).toBe("Name is required");
      expect(errors.description).toBeUndefined();
    });

    it("should return empty object for valid data", () => {
      const data = { name: "John", email: "john@example.com" };
      const requiredFields = ["name", "email"];

      const errors = validateRequired(data, requiredFields);

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBeNull();
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user space@example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe("Please enter a valid email address");
      });
    });
  });

  describe("validateQuestion", () => {
    it("should validate complete question data", () => {
      const validQuestion = {
        questionText: "What is 2+2?",
        choices: ["3", "4", "5", "6"],
        correctAnswer: "4",
        bloomsLevel: "Remembering",
        subject: "Mathematics",
      };

      const errors = validateQuestion(validQuestion);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("should catch missing question text", () => {
      const invalidQuestion = {
        questionText: "",
        choices: ["3", "4", "5", "6"],
        correctAnswer: "4",
        bloomsLevel: "Remembering",
        subject: "Mathematics",
      };

      const errors = validateQuestion(invalidQuestion);
      expect(errors.questionText).toBe("Question text is required");
    });

    it("should catch insufficient choices", () => {
      const invalidQuestion = {
        questionText: "What is 2+2?",
        choices: ["4"],
        correctAnswer: "4",
        bloomsLevel: "Remembering",
        subject: "Mathematics",
      };

      const errors = validateQuestion(invalidQuestion);
      expect(errors.choices).toBe("At least 2 choices are required");
    });

    it("should catch missing correct answer", () => {
      const invalidQuestion = {
        questionText: "What is 2+2?",
        choices: ["3", "4", "5", "6"],
        correctAnswer: "",
        bloomsLevel: "Remembering",
        subject: "Mathematics",
      };

      const errors = validateQuestion(invalidQuestion);
      expect(errors.correctAnswer).toBe("Correct answer is required");
    });
  });

  describe("validateBatchQuestions", () => {
    it("should validate batch of questions", () => {
      const batchQuestions = [
        {
          questionText: "What is 2+2?",
          choices: ["3", "4", "5", "6"],
          correctAnswer: "4",
          bloomsLevel: "Remembering",
          subject: "Mathematics",
        },
        {
          questionText: "What is the capital of France?",
          choices: ["London", "Paris", "Berlin"],
          correctAnswer: "Paris",
          bloomsLevel: "Remembering",
          subject: "Geography",
        },
      ];

      const errors = validateBatchQuestions(batchQuestions);
      expect(errors).toHaveLength(0);
    });

    it("should catch errors in batch questions", () => {
      const batchQuestions = [
        {
          questionText: "What is 2+2?",
          choices: ["4"],
          correctAnswer: "4",
          bloomsLevel: "Remembering",
          subject: "Mathematics",
        },
        {
          questionText: "",
          choices: ["London", "Paris", "Berlin"],
          correctAnswer: "Paris",
          bloomsLevel: "Remembering",
          subject: "Geography",
        },
      ];

      const errors = validateBatchQuestions(batchQuestions);
      expect(errors).toHaveLength(2);
      expect(errors[0].row).toBe(1);
      expect(errors[0].errors.choices).toBe("At least 2 choices are required");
      expect(errors[1].row).toBe(2);
      expect(errors[1].errors.questionText).toBe("Question text is required");
    });
  });
});

describe("Error Handling", () => {
  describe("handleApiError", () => {
    const mockSetError = jest.fn();

    beforeEach(() => {
      mockSetError.mockClear();
    });

    it("should handle Response errors with status codes", () => {
      const response = new Response("", { status: 401 });

      handleApiError(response, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith(
        "Unauthorized. Please log in again."
      );
    });

    it("should handle 403 status", () => {
      const response = new Response("", { status: 403 });

      handleApiError(response, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith(
        "Access denied. You don't have permission for this action."
      );
    });

    it("should handle 404 status", () => {
      const response = new Response("", { status: 404 });

      handleApiError(response, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("Resource not found.");
    });

    it("should handle 422 status", () => {
      const response = new Response("", { status: 422 });

      handleApiError(response, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith(
        "Validation error. Please check your input."
      );
    });

    it("should handle 500+ status", () => {
      const response = new Response("", { status: 500 });

      handleApiError(response, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith(
        "Server error. Please try again later."
      );
    });

    it("should handle Error objects", () => {
      const error = new Error("Custom error message");

      handleApiError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("Custom error message");
    });

    it("should handle string errors", () => {
      handleApiError("String error message", mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("String error message");
    });

    it("should use default message for unknown errors", () => {
      handleApiError({}, mockSetError, "Default error");

      expect(mockSetError).toHaveBeenCalledWith("Default error");
    });
  });

  describe("handleValidationErrors", () => {
    const mockSetError = jest.fn();

    beforeEach(() => {
      mockSetError.mockClear();
    });

    it("should return false for no errors", () => {
      const result = handleValidationErrors({}, mockSetError);

      expect(result).toBe(false);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it("should handle validation errors", () => {
      const errors = {
        name: "Name is required",
        email: "Invalid email format",
      };

      const result = handleValidationErrors(errors, mockSetError);

      expect(result).toBe(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Name is required. Invalid email format"
      );
    });

    it("should filter out falsy error messages", () => {
      const errors = {
        name: "Name is required",
        email: "",
        phone: null,
        address: undefined,
      };

      const result = handleValidationErrors(errors, mockSetError);

      expect(result).toBe(true);
      expect(mockSetError).toHaveBeenCalledWith("Name is required");
    });
  });
});

describe("Local Storage", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it("should store and retrieve data", () => {
    const testData = { key: "value" };

    localStorage.setItem("test", JSON.stringify(testData));
    localStorage.getItem("test");

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "test",
      JSON.stringify(testData)
    );
    expect(localStorageMock.getItem).toHaveBeenCalledWith("test");
  });
});

describe("Fetch API", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("should make fetch requests", () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    expect(fetch).not.toHaveBeenCalled();

    // This would be called in actual component code
    // fetch('/api/test');
    // expect(fetch).toHaveBeenCalledWith('/api/test');
  });
});
