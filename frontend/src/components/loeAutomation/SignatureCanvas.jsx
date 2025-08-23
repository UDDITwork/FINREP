/**
 * FILE LOCATION: frontend/src/components/loeAutomation/SignatureCanvas.jsx
 * 
 * PURPOSE: Simple signature canvas component
 * 
 * FUNCTIONALITY: Capture digital signatures without external dependencies
 */

import React, { useRef, useEffect, useState } from 'react';

const SignatureCanvas = ({ onSignatureChange, width = 400, height = 200 }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    setHasSignature(true);
    
    // Get signature data
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSignatureChange(signatureData);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="signature-canvas-container">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      <div className="flex justify-between items-center mt-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear Signature
        </button>
        {hasSignature && (
          <span className="text-sm text-green-600">
            ✓ Signature captured
          </span>
        )}
      </div>
    </div>
  );
};

export default SignatureCanvas;
