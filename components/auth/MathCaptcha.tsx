'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaRedo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface MathCaptchaProps {
  onValidate: (isValid: boolean) => void;
}

interface CaptchaChallenge {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*';
  answer: number;
}

export default function MathCaptcha({ onValidate }: MathCaptchaProps) {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const generateChallenge = useCallback((): CaptchaChallenge => {
    const operators: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1: number;
    let num2: number;
    let answer: number;

    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    return { num1, num2, operator, answer };
  }, []);

  const refreshCaptcha = useCallback(() => {
    const newChallenge = generateChallenge();
    setChallenge(newChallenge);
    setUserAnswer('');
    setValidationState('idle');
    onValidate(false);
  }, [generateChallenge, onValidate]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleAnswerChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9-]/g, '');
    setUserAnswer(numericValue);

    if (numericValue === '') {
      setValidationState('idle');
      onValidate(false);
      return;
    }

    const parsedAnswer = parseInt(numericValue, 10);
    const isValid = challenge !== null && parsedAnswer === challenge.answer;
    
    setValidationState(isValid ? 'valid' : 'invalid');
    onValidate(isValid);
  };

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      default: return op;
    }
  };

  if (!challenge) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Security Check
        </span>
        <button
          type="button"
          onClick={refreshCaptcha}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
          title="Get new question"
        >
          <FaRedo size={12} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Math Question */}
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 px-4">
            <span className="text-lg font-bold text-slate-700">{challenge.num1}</span>
            <span className="text-lg font-bold text-indigo-600">{getOperatorSymbol(challenge.operator)}</span>
            <span className="text-lg font-bold text-slate-700">{challenge.num2}</span>
            <span className="text-lg font-bold text-slate-400">=</span>
            <span className="text-lg font-bold text-slate-400">?</span>
          </div>
        </div>

        {/* Answer Input */}
        <div className="w-24">
          <input
            type="text"
            inputMode="numeric"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="?"
            className={`w-full bg-white border rounded-xl py-3 px-3 text-center text-lg font-bold outline-none transition-all
              ${validationState === 'valid' 
                ? 'border-green-500 text-green-600 focus:ring-2 focus:ring-green-500/50' 
                : validationState === 'invalid' && userAnswer !== ''
                  ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-500/50'
                  : 'border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500/50'
              }`}
          />
        </div>

        {/* Validation Icon */}
        <div className="w-8 flex justify-center">
          {validationState === 'valid' && (
            <FaCheckCircle className="text-green-500" size={20} />
          )}
          {validationState === 'invalid' && userAnswer !== '' && (
            <FaTimesCircle className="text-red-500" size={20} />
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-center">
        Solve the math problem to continue
      </p>
    </div>
  );
}
