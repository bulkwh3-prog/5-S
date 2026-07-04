import React, { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon, Camera } from "lucide-react";
import { motion } from "motion/react";

interface UploadBoxProps {
  label: string;
  type: "before" | "after";
  imageUrl: string | null;
  onImageStamped: (dataUrl: string | null) => void;
}

export function UploadBox({ label, type, imageUrl, onImageStamped }: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndStampImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }

            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Watermark size relative to image dimensions
            const fontSize = Math.max(20, Math.floor(img.width * 0.035));
            ctx.font = `bold ${fontSize}px "Inter", "Sarabun", sans-serif`;

            // Prepare Timestamp Text
            const now = new Date();
            const dateStr = now.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false
            });
            const watermarkText = `📷 ${type === "before" ? "BEFORE" : "AFTER"} | ${dateStr}`;

            // Draw a rounded translucent badge background at bottom-right
            const textWidth = ctx.measureText(watermarkText).width;
            const paddingX = fontSize * 0.6;
            const paddingY = fontSize * 0.4;
            const boxWidth = textWidth + (paddingX * 2);
            const boxHeight = fontSize + (paddingY * 2);

            const posX = canvas.width - boxWidth - (fontSize * 0.6);
            const posY = canvas.height - boxHeight - (fontSize * 0.6);

            // Base badge background (Slate/Black)
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            const radius = fontSize * 0.4;
            ctx.beginPath();
            ctx.moveTo(posX + radius, posY);
            ctx.lineTo(posX + boxWidth - radius, posY);
            ctx.quadraticCurveTo(posX + boxWidth, posY, posX + boxWidth, posY + radius);
            ctx.lineTo(posX + boxWidth, posY + boxHeight - radius);
            ctx.quadraticCurveTo(posX + boxWidth, posY + boxHeight, posX + boxWidth - radius, posY + boxHeight);
            ctx.lineTo(posX + radius, posY + boxHeight);
            ctx.quadraticCurveTo(posX, posY + boxHeight, posX, posY + boxHeight - radius);
            ctx.lineTo(posX, posY + radius);
            ctx.quadraticCurveTo(posX, posY, posX + radius, posY);
            ctx.closePath();
            ctx.fill();

            // Accent border: Red/Orange for Before, Emerald/Green for After
            ctx.strokeStyle = type === "before" ? "rgba(239, 68, 68, 0.6)" : "rgba(16, 185, 129, 0.6)";
            ctx.lineWidth = Math.max(1, Math.floor(fontSize * 0.06));
            ctx.stroke();

            // White text
            ctx.fillStyle = "#ffffff";
            ctx.textBaseline = "middle";
            ctx.fillText(watermarkText, posX + paddingX, posY + (boxHeight / 2));

            // Output JPEG data URL
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = () => reject(new Error("ไม่สามารถโหลดรูปภาพนี้ได้"));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์"));
        reader.readAsDataURL(file);
      });

      onImageStamped(dataUrl);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
      onImageStamped(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndStampImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndStampImage(e.target.files[0]);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageStamped(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div id={`${type}-upload-card`} className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${type === "before" ? "bg-pink-500 animate-pulse" : "bg-cyan-500"}`} />
          {label}
        </label>
        {imageUrl && (
          <span className={`text-xs font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
            type === "before"
              ? "bg-pink-50 text-pink-600 border-pink-100"
              : "bg-cyan-50 text-cyan-600 border-cyan-100"
          }`}>
            <Check className="w-3.5 h-3.5" /> แสตมป์เวลาแล้ว
          </span>
        )}
      </div>

      <div
        id={`${type}-dropzone`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerPicker}
        className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer min-h-[220px] transition-all duration-300 overflow-hidden group ${
          imageUrl
            ? "border-slate-200 bg-slate-50/50"
            : isDragActive
            ? type === "before"
              ? "border-pink-500 bg-pink-50/40 shadow-lg shadow-pink-500/5"
              : "border-cyan-500 bg-cyan-50/40 shadow-lg shadow-cyan-500/5"
            : type === "before"
            ? "border-pink-200/80 hover:border-pink-400 bg-pink-50/5 hover:bg-pink-50/10 shadow-xs"
            : "border-cyan-200/80 hover:border-cyan-400 bg-cyan-50/5 hover:bg-cyan-50/10 shadow-xs"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Image Preview with overlay */}
            <img
              src={imageUrl}
              alt={`${type} cleaning state`}
              className="max-h-[280px] w-auto object-contain rounded-2xl shadow-md border border-slate-200"
            />
            {/* Clear Button */}
            <button
              type="button"
              id={`${type}-remove-btn`}
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-2 bg-slate-900 text-white rounded-full shadow-lg hover:bg-pink-600 transition duration-150 active:scale-90"
              title="ลบรูปภาพ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className={`animate-spin rounded-full h-10 w-10 border-4 border-t-transparent ${type === "before" ? "border-pink-500" : "border-cyan-500"}`} />
            <p className="text-sm text-slate-500 font-bold">กำลังแสตมป์วันที่และเวลาลงในรูปภาพ...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-3 transition-colors ${
              type === "before" ? "bg-pink-50 text-pink-500 group-hover:bg-pink-100" : "bg-cyan-50 text-cyan-500 group-hover:bg-cyan-100"
            }`}>
              {type === "before" ? <Camera className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
            
            <p className="text-sm font-black text-slate-800 mb-1">
              คลิก หรือ ลากไฟล์รูปเพื่ออัปโหลด
            </p>
            <p className="text-xs text-slate-400 max-w-[200px] mb-3 leading-relaxed font-medium">
              รองรับไฟล์รูปทุกชนิด และจะทำแสตมป์วันที่/เวลาให้อัตโนมัติ
            </p>
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              type === "before" 
                ? "bg-pink-50 text-pink-700 border border-pink-100/50" 
                : "bg-cyan-50 text-cyan-700 border border-cyan-100/50"
            }`}>
              <ImageIcon className="w-3.5 h-3.5" />
              อัปโหลดภาพ {type === "before" ? "พื้นที่ยังสกปรก" : "ที่ทำความสะอาดเสร็จแล้ว"}
            </span>
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-100 text-red-800 text-xs py-1 px-2 rounded-lg font-bold text-center border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
