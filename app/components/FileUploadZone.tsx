import React, { useCallback, useRef, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  description?: string;
  disabled?: boolean;
}

export default function FileUploadZone({
  onFileSelect,
  accept = ".csv",
  description = "Upload your TCGPlayer CSV export file",
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      sx={{
        border: "2px dashed",
        borderColor: isDragging
          ? "primary.main"
          : fileName
          ? "success.main"
          : "divider",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        bgcolor: isDragging ? "action.hover" : "transparent",
        transition: "all 0.2s ease",
        "&:hover": disabled
          ? {}
          : {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={handleInputChange}
      />
      <Stack spacing={1} alignItems="center">
        {fileName ? (
          <>
            <DescriptionIcon sx={{ fontSize: 48, color: "success.main" }} />
            <Typography variant="body1" fontWeight={600}>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click or drag to replace
            </Typography>
          </>
        ) : (
          <>
            <UploadFileIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="body1" fontWeight={600}>
              Drop your CSV file here or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}
