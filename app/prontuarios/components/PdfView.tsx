// components/PdfViewer.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { MedicalRecord } from '../page';

interface PdfViewerProps {
  selectedRecord: MedicalRecord | null;
  currentPdfIndex: number;
  onPdfIndexChange: (index: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  selectedRecord,
  currentPdfIndex,
  onPdfIndexChange
}) => {
  const [zoom, setZoom] = useState<number>(100);

  const currentPdfUrl = selectedRecord?.pdfUrls?.[currentPdfIndex]?.url ?? "";
  const currentPdfTitle = selectedRecord?.pdfUrls?.[currentPdfIndex]?.title ?? "";
  const totalPdfs = selectedRecord?.pdfUrls?.length ?? 0;

  const changePdfIndex = (dir: "next" | "prev" | "go", val?: number) => {
    if (!selectedRecord) return;
    
    if (dir === "next") onPdfIndexChange(Math.min(currentPdfIndex + 1, totalPdfs - 1));
    if (dir === "prev") onPdfIndexChange(Math.max(currentPdfIndex - 1, 0));
    if (dir === "go" && typeof val === "number") onPdfIndexChange(Math.min(Math.max(val, 0), totalPdfs - 1));
  };

  return (
    <main className="flex-1 bg-default-900 relative flex flex-col">
      {selectedRecord ? (
        <>
          {/* Header do PDF Viewer */}
          <div className="flex items-center justify-between px-4 py-3 bg-default-800 text-default-50 shadow-lg">
            <div className="truncate pr-4 flex-1">
              <h3 className="font-semibold text-md truncate">{currentPdfTitle}</h3>
              <p className="text-xs text-default-300 truncate">
                {selectedRecord.NOME} • {selectedRecord.TIPOEXAMENOME}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Navegação entre PDFs */}
              <Button
                isIconOnly
                variant="light"
                onPress={() => changePdfIndex("prev")}
                isDisabled={currentPdfIndex === 0}
                className="text-default-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <span className="text-sm font-medium px-2">
                {currentPdfIndex + 1} / {totalPdfs}
              </span>
              
              <Button
                isIconOnly
                variant="light"
                onPress={() => changePdfIndex("next")}
                isDisabled={currentPdfIndex >= totalPdfs - 1}
                className="text-default-50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Botão Tela Cheia */}
              <Button
                isIconOnly
                variant="light"
                onPress={() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe?.requestFullscreen) {
                    iframe.requestFullscreen();
                  }
                }}
                className="text-default-50 ml-2"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Área do PDF */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <iframe
              src={currentPdfUrl}
              title={currentPdfTitle}
              className="bg-white shadow-2xl rounded-lg transition-all duration-300"
              style={{
                width: `${zoom}%`,
                height: `${zoom}%`,
                maxWidth: "100%",
                maxHeight: "100%",
                minWidth: "50%",
                minHeight: "50%",
                border: 0,
              }}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-default-400">
          <Card className="bg-default-800 border-default-700">
            <CardBody className="text-center p-8">
              <Eye className="w-12 h-12 mx-auto mb-4 text-default-300" />
              <h3 className="text-xl font-light mb-2 text-default-200">Selecione um prontuário</h3>
              <p className="text-default-400">Clique em um item da lista para começar a avaliação.</p>
            </CardBody>
          </Card>
        </div>
      )}
    </main>
  );
};

export default PdfViewer;