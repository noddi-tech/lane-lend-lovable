import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Text as FabricText, Group, Line } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
}

interface Lane {
  id: string;
  name?: string;
  position_order?: number;
  grid_position_x?: number;
  grid_position_y?: number;
  grid_width?: number;
  grid_height?: number;
}

interface Station {
  id: string;
  name?: string;
  grid_position_x?: number;
  grid_position_y?: number;
  grid_width?: number;
  grid_height?: number;
}

interface Room {
  id: string;
  name: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
  color?: string;
}

interface OutsideArea {
  id: string;
  name: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
  color?: string;
  area_type?: string;
}

interface StorageLocation {
  id: string;
  name: string;
  grid_position_x?: number;
  grid_position_y?: number;
  grid_width?: number;
  grid_height?: number;
  storage_type?: string;
  status?: string;
}

interface Zone {
  id: string;
  name: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
  color?: string;
  zone_type?: string;
}

export type EditMode = 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage' | 'zone' | 'view';

interface UnifiedGridBuilderProps {
  gridWidth: number;
  gridHeight: number;
  gates: Gate[];
  lanes?: Lane[];
  stations?: Station[];
  rooms?: Room[];
  outsideAreas?: OutsideArea[];
  storageLocations?: StorageLocation[];
  zones?: Zone[];
  editMode: EditMode;
  onGateMove?: (gateId: string, gridX: number, gridY: number) => void;
  onLaneMove?: (laneId: string, gridX: number, gridY: number) => void;
  onStationMove?: (stationId: string, gridX: number, gridY: number) => void;
  onRoomMove?: (roomId: string, gridX: number, gridY: number) => void;
  onOutsideAreaMove?: (areaId: string, gridX: number, gridY: number) => void;
  onStorageLocationMove?: (storageId: string, gridX: number, gridY: number) => void;
  onZoneMove?: (zoneId: string, gridX: number, gridY: number) => void;
  onFacilityResize?: (gridWidth: number, gridHeight: number) => void;
  onGateResize?: (gateId: string, gridWidth: number, gridHeight: number) => void;
  onLaneResize?: (laneId: string, gridWidth: number, gridHeight: number) => void;
  onStationResize?: (stationId: string, gridWidth: number, gridHeight: number) => void;
  onRoomResize?: (roomId: string, gridWidth: number, gridHeight: number) => void;
  onOutsideAreaResize?: (areaId: string, gridWidth: number, gridHeight: number) => void;
  onStorageLocationResize?: (storageId: string, gridWidth: number, gridHeight: number) => void;
  onZoneResize?: (zoneId: string, gridWidth: number, gridHeight: number) => void;
  onElementSelect?: (element: { type: string; id: string; data: any }) => void;
}

const CELL_SIZE = 20;

const COLORS = {
  facility: {
    grid: 'rgba(255, 107, 107, 0.4)',
    background: '#FFFFFF',
    stroke: 'rgb(220, 38, 38)',
    strokeWidth: 2,
  },
  gates: {
    fill: 'rgba(16, 185, 129, 0.6)',
    stroke: 'rgb(5, 150, 105)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 4,
  },
  lanes: {
    fill: 'rgba(147, 51, 234, 0.4)',
    stroke: 'rgb(126, 34, 206)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 3,
  },
  stations: {
    fill: 'rgba(249, 115, 22, 0.7)',
    stroke: 'rgb(194, 65, 12)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 3,
  },
  rooms: {
    fill: 'rgba(96, 165, 250, 0.3)',
    stroke: 'rgb(37, 99, 235)',
    text: 'rgb(30, 58, 138)',
    strokeWidth: 2,
  },
  outside: {
    fill: 'rgba(134, 239, 172, 0.3)',
    stroke: 'rgb(22, 163, 74)',
    text: 'rgb(20, 83, 45)',
    strokeWidth: 2,
  },
  storage: {
    fill: 'rgba(253, 224, 71, 0.4)',
    stroke: 'rgb(202, 138, 4)',
    text: 'rgb(113, 63, 18)',
    strokeWidth: 2,
  },
  zones: {
    fill: 'rgba(244, 114, 182, 0.3)',
    stroke: 'rgb(219, 39, 119)',
    text: 'rgb(131, 24, 67)',
    strokeWidth: 2,
  },
  selected: {
    stroke: 'rgb(59, 130, 246)',
    strokeWidth: 4,
  },
};

export function UnifiedGridBuilder({
  gridWidth,
  gridHeight,
  gates,
  lanes = [],
  stations = [],
  rooms = [],
  outsideAreas = [],
  storageLocations = [],
  zones = [],
  editMode,
  onGateMove,
  onLaneMove,
  onStationMove,
  onRoomMove,
  onOutsideAreaMove,
  onStorageLocationMove,
  onZoneMove,
  onFacilityResize,
  onGateResize,
  onLaneResize,
  onStationResize,
  onRoomResize,
  onOutsideAreaResize,
  onStorageLocationResize,
  onZoneResize,
  onElementSelect,
}: UnifiedGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(0.67); // Start at 67% for better overview
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  
  // Use refs for panning state to avoid stale closures
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  
  // Ref to prevent infinite loop when programmatically setting selection
  const selectionChangeInProgress = useRef(false);
  
  // Store data in ref to prevent event handler re-registration
  const dataRef = useRef({
    lanes,
    rooms,
    outsideAreas,
    zones,
    stations,
    storageLocations,
  });

  // Calculate bounds of all elements
  const calculateBounds = useCallback(() => {
    const allElements = [
      ...rooms.map(r => ({ x: r.grid_x || 0, y: r.grid_y || 0, w: r.grid_width || 10, h: r.grid_height || 10 })),
      ...gates.map(g => ({ x: g.grid_x || 0, y: g.grid_y || 0, w: g.grid_width || 10, h: g.grid_height || 10 })),
      ...outsideAreas.map(a => ({ x: a.grid_x || 0, y: a.grid_y || 0, w: a.grid_width || 10, h: a.grid_height || 10 })),
      ...zones.map(z => ({ x: z.grid_x || 0, y: z.grid_y || 0, w: z.grid_width || 10, h: z.grid_height || 10 })),
      ...stations.map(s => ({ x: s.grid_position_x || 0, y: s.grid_position_y || 0, w: s.grid_width || 2, h: s.grid_height || 2 })),
      ...storageLocations.map(s => ({ x: s.grid_position_x || 0, y: s.grid_position_y || 0, w: s.grid_width || 1, h: s.grid_height || 1 })),
    ];
    
    if (allElements.length === 0) return null;
    
    const minX = Math.min(...allElements.map(e => e.x));
    const minY = Math.min(...allElements.map(e => e.y));
    const maxX = Math.max(...allElements.map(e => e.x + e.w));
    const maxY = Math.max(...allElements.map(e => e.y + e.h));
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [rooms, gates, outsideAreas, zones, stations, storageLocations]);

  // Zoom to fit all elements
  const zoomToFit = useCallback(() => {
    if (!canvas || !containerRef.current) return;
    
    const bounds = calculateBounds();
    if (!bounds) return;
    
    const padding = 50; // pixels
    const containerWidth = containerRef.current.clientWidth - padding * 2;
    const containerHeight = containerRef.current.clientHeight - padding * 2;
    
    const boundsWidth = bounds.width * CELL_SIZE;
    const boundsHeight = bounds.height * CELL_SIZE;
    
    const scaleX = containerWidth / boundsWidth;
    const scaleY = containerHeight / boundsHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5); // Max 150% zoom
    
    const centerX = (bounds.minX + bounds.maxX) / 2 * CELL_SIZE;
    const centerY = (bounds.minY + bounds.maxY) / 2 * CELL_SIZE;
    
    canvas.setZoom(newZoom);
    setZoom(newZoom);
    
    const viewportCenterX = containerRef.current.clientWidth / 2;
    const viewportCenterY = containerRef.current.clientHeight / 2;
    
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] = -(centerX * newZoom - viewportCenterX);
      vpt[5] = -(centerY * newZoom - viewportCenterY);
    }
    
    canvas.requestRenderAll();
  }, [canvas, calculateBounds]);
  
  // Store callbacks in refs to prevent useEffect re-runs
  const callbacksRef = useRef({
    onGateMove,
    onLaneMove,
    onStationMove,
    onRoomMove,
    onOutsideAreaMove,
    onStorageLocationMove,
    onZoneMove,
    onFacilityResize,
    onGateResize,
    onLaneResize,
    onStationResize,
    onRoomResize,
    onOutsideAreaResize,
    onStorageLocationResize,
    onZoneResize,
    onElementSelect,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onGateMove,
      onLaneMove,
      onStationMove,
      onRoomMove,
      onOutsideAreaMove,
      onStorageLocationMove,
      onZoneMove,
      onFacilityResize,
      onGateResize,
      onLaneResize,
      onStationResize,
      onRoomResize,
      onOutsideAreaResize,
      onStorageLocationResize,
      onZoneResize,
      onElementSelect,
    };
  });

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = {
      lanes,
      rooms,
      outsideAreas,
      zones,
      stations,
      storageLocations,
    };
  }, [lanes, rooms, outsideAreas, stations, storageLocations]);

  // Validate element placement based on containment rules - use dataRef for current data
  const validatePlacement = (
    type: string,
    gridX: number,
    gridY: number,
    gridWidth: number,
    gridHeight: number
  ): { valid: boolean; reason?: string; parentLaneId?: string } => {
    // Stations can be inside a lane, room, zone, or outside area
    if (type === 'station') {
      // Check if in lane
      const containingLane = dataRef.current.lanes?.find(lane => {
        const laneY = lane.grid_position_y || 0;
        const laneHeight = lane.grid_height || 5;
        return gridY >= laneY && gridY + gridHeight <= laneY + laneHeight;
      });
      
      if (containingLane) {
        return { valid: true, parentLaneId: containingLane.id };
      }
      
      // Check if in room
      const containingRoom = dataRef.current.rooms?.find(room => {
        const roomX = room.grid_x || 0;
        const roomY = room.grid_y || 0;
        const roomWidth = room.grid_width || 10;
        const roomHeight = room.grid_height || 10;
        return (
          gridX >= roomX && 
          gridX + gridWidth <= roomX + roomWidth &&
          gridY >= roomY && 
          gridY + gridHeight <= roomY + roomHeight
        );
      });
      
      if (containingRoom) {
        return { valid: true };
      }
      
      // Check if in zone
      const containingZone = dataRef.current.zones?.find(zone => {
        const zoneX = zone.grid_x || 0;
        const zoneY = zone.grid_y || 0;
        const zoneWidth = zone.grid_width || 10;
        const zoneHeight = zone.grid_height || 10;
        return (
          gridX >= zoneX && 
          gridX + gridWidth <= zoneX + zoneWidth &&
          gridY >= zoneY && 
          gridY + gridHeight <= zoneY + zoneHeight
        );
      });
      
      if (containingZone) {
        return { valid: true };
      }
      
      // Check if in outside area
      const containingOutside = dataRef.current.outsideAreas?.find(area => {
        const areaX = area.grid_x || 0;
        const areaY = area.grid_y || 0;
        const areaWidth = area.grid_width || 10;
        const areaHeight = area.grid_height || 10;
        return (
          gridX >= areaX && 
          gridX + gridWidth <= areaX + areaWidth &&
          gridY >= areaY && 
          gridY + gridHeight <= areaY + areaHeight
        );
      });
      
      if (containingOutside) {
        return { valid: true };
      }
      
      // Not in any valid container
      return { valid: false, reason: 'Stations must be placed inside a lane, room, zone, or outside area' };
    }
    
    // Storage must be inside a lane or room
    if (type === 'storage') {
      const inLane = dataRef.current.lanes?.some(lane => {
        const laneY = lane.grid_position_y || 0;
        const laneHeight = lane.grid_height || 5;
        return gridY >= laneY && gridY + gridHeight <= laneY + laneHeight;
      });
      
      const inRoom = dataRef.current.rooms?.some(room => {
        const roomX = room.grid_x || 0;
        const roomY = room.grid_y || 0;
        const roomWidth = room.grid_width || 10;
        const roomHeight = room.grid_height || 10;
        return (
          gridX >= roomX && 
          gridX + gridWidth <= roomX + roomWidth &&
          gridY >= roomY && 
          gridY + gridHeight <= roomY + roomHeight
        );
      });
      
      if (!inLane && !inRoom) {
        return { valid: false, reason: 'Storage must be inside a lane or room' };
      }
    }
    
    return { valid: true };
  };

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const aspectRatio = gridHeight / gridWidth;
      const calculatedHeight = Math.min(width * aspectRatio, 800);
      setCanvasDimensions({ 
        width: Math.max(800, width - 40), 
        height: Math.max(600, calculatedHeight) 
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [gridWidth, gridHeight]);

  // Initialize canvas once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: COLORS.facility.background,
      selection: false,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []); // Only create once

  // Update canvas size when dimensions change
  useEffect(() => {
    if (!canvas) return;
    canvas.setDimensions(canvasDimensions);
    canvas.renderAll();
  }, [canvas, canvasDimensions]);

  // Auto-fit view when elements load
  useEffect(() => {
    if (!canvas || rooms.length === 0) return;
    
    // Delay to ensure canvas is fully rendered
    const timer = setTimeout(() => {
      zoomToFit();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [canvas, rooms.length > 0, zoomToFit]);

  // Removed: canvas.selection toggle - always keep false to disable multi-select box

  // Canvas-level event handlers for element interaction
  useEffect(() => {
    if (!canvas) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const { type } = obj.data;
      const left = obj.left || 0;
      const top = obj.top || 0;

      const snappedLeft = Math.round(left / CELL_SIZE) * CELL_SIZE;
      const snappedTop = Math.round(top / CELL_SIZE) * CELL_SIZE;

      if (type === 'lane') {
        obj.set({ left: 0, top: snappedTop });
      } else {
        obj.set({ left: snappedLeft, top: snappedTop });
      }

      // Visual feedback for validation during drag
      const rect = obj._objects?.[0];
      if (rect && (type === 'station' || type === 'storage')) {
        const gridX = Math.round(snappedLeft / CELL_SIZE);
        const gridY = Math.round(snappedTop / CELL_SIZE);
        const gridWidth = Math.round((rect.width || 0) / CELL_SIZE);
        const gridHeight = Math.round((rect.height || 0) / CELL_SIZE);
        
        const validation = validatePlacement(type, gridX, gridY, gridWidth, gridHeight);
        
        // Change border color based on validity
        rect.set({
          stroke: validation.valid ? (type === 'station' ? COLORS.stations.stroke : COLORS.storage.stroke) : '#ef4444',
          strokeWidth: validation.valid ? (type === 'station' ? COLORS.stations.strokeWidth : COLORS.storage.strokeWidth) : 4,
        });
      }

      canvas.renderAll();
    };

    const handleObjectScaling = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const rect = obj._objects?.[0];
      const text = obj._objects?.[1];
      if (!rect) return;

      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      
      // Use base grid dimensions to prevent exponential growth
      const baseGridWidth = obj.data.baseGridWidth || 10;
      const baseGridHeight = obj.data.baseGridHeight || 10;
      const baseWidth = baseGridWidth * CELL_SIZE;
      const baseHeight = baseGridHeight * CELL_SIZE;

      const newWidth = Math.round((baseWidth * scaleX) / CELL_SIZE) * CELL_SIZE;
      const newHeight = Math.round((baseHeight * scaleY) / CELL_SIZE) * CELL_SIZE;

      rect.set({ width: newWidth, height: newHeight });
      obj.set({ scaleX: 1, scaleY: 1 });
      
      // Update base grid dimensions for next resize
      obj.data.baseGridWidth = Math.round(newWidth / CELL_SIZE);
      obj.data.baseGridHeight = Math.round(newHeight / CELL_SIZE);

      if (text && obj.data.type === 'lane') {
        text.set({ top: newHeight / 2 - 7 });
      } else if (text && obj.data.type === 'gate') {
        text.set({ left: newWidth / 2 - 6 });
      } else if (text && obj.data.type === 'station') {
        text.set({ left: newWidth / 2 - 20, top: newHeight / 2 - 8 });
      } else if (text && obj.data.type === 'room') {
        text.set({ left: newWidth / 2 - 30, top: newHeight / 2 - 8 });
      } else if (text && obj.data.type === 'outside') {
        text.set({ left: newWidth / 2 - 30, top: newHeight / 2 - 8 });
      } else if (text && obj.data.type === 'storage') {
        text.set({ left: newWidth / 2 - 20, top: newHeight / 2 - 8 });
      } else if (text && obj.data.type === 'zone') {
        text.set({ left: newWidth / 2 - 30, top: newHeight / 2 - 8 });
      }

      canvas.renderAll();
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const { type, id } = obj.data;
      const gridX = Math.round((obj.left || 0) / CELL_SIZE);
      const gridY = Math.round((obj.top || 0) / CELL_SIZE);

      // Use the base grid dimensions that were set during object:scaling
      // instead of re-calculating from rect.width/height (which can be scaled)
      const gridWidth = obj.data.baseGridWidth || 10;
      const gridHeight = obj.data.baseGridHeight || 10;
      
      const rect = obj._objects?.[0];

      // Validate placement for containment rules
      const validation = validatePlacement(type, gridX, gridY, gridWidth, gridHeight);
      
      if (!validation.valid) {
        // Show error and revert by re-rendering all elements
        import('sonner').then(({ toast }) => {
          toast.error(validation.reason || 'Invalid placement');
        });
        
        // Reset border color
        if (rect) {
          rect.set({
            stroke: type === 'station' ? COLORS.stations.stroke : COLORS.storage.stroke,
            strokeWidth: type === 'station' ? COLORS.stations.strokeWidth : COLORS.storage.strokeWidth,
          });
        }
        
        // Re-render to reset position
        canvas.renderAll();
        return;
      }

      // Reset border color on successful placement
      if (rect && (type === 'station' || type === 'storage')) {
        rect.set({
          stroke: type === 'station' ? COLORS.stations.stroke : COLORS.storage.stroke,
          strokeWidth: type === 'station' ? COLORS.stations.strokeWidth : COLORS.storage.strokeWidth,
        });
      }

      if (type === 'gate') {
        callbacksRef.current.onGateMove?.(id, gridX, gridY);
        callbacksRef.current.onGateResize?.(id, gridWidth, gridHeight);
      } else if (type === 'lane') {
        callbacksRef.current.onLaneMove?.(id, gridX, gridY);
        callbacksRef.current.onLaneResize?.(id, gridWidth, gridHeight);
      } else if (type === 'station') {
        callbacksRef.current.onStationMove?.(id, gridX, gridY);
        callbacksRef.current.onStationResize?.(id, gridWidth, gridHeight);
      } else if (type === 'room') {
        callbacksRef.current.onRoomMove?.(id, gridX, gridY);
        callbacksRef.current.onRoomResize?.(id, gridWidth, gridHeight);
      } else if (type === 'outside') {
        callbacksRef.current.onOutsideAreaMove?.(id, gridX, gridY);
        callbacksRef.current.onOutsideAreaResize?.(id, gridWidth, gridHeight);
      } else if (type === 'storage') {
        callbacksRef.current.onStorageLocationMove?.(id, gridX, gridY);
        callbacksRef.current.onStorageLocationResize?.(id, gridWidth, gridHeight);
      } else if (type === 'zone') {
        callbacksRef.current.onZoneMove?.(id, gridX, gridY);
        callbacksRef.current.onZoneResize?.(id, gridWidth, gridHeight);
      }
    };

    const handleSelectionCreated = (e: any) => {
      // Skip callback if this is a programmatic selection change
      if (selectionChangeInProgress.current) {
        selectionChangeInProgress.current = false;
        return;
      }
      
      const obj = e.selected?.[0];
      console.log('🎯 SELECTION CREATED:', {
        hasObject: !!obj,
        objectType: obj?.data?.type,
        objectId: obj?.data?.id,
        selectable: obj?.selectable,
        evented: obj?.evented,
        currentEditMode: editMode,
        activeObject: (canvas.getActiveObject() as any)?.data,
      });
      
      if (obj?.data) {
        callbacksRef.current.onElementSelect?.(obj.data);
      }
    };

    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);

    return () => {
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
    };
  }, [canvas]);

  // Panning handlers - use refs to prevent stale closures
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      console.log('🖱️ MOUSE DOWN:', {
        hasTarget: !!e.target,
        targetType: e.target?.data?.type,
        targetId: e.target?.data?.id,
        targetSelectable: e.target?.selectable,
        targetEvented: e.target?.evented,
        altKey: e.e.altKey,
        button: e.e.button,
        currentEditMode: editMode,
        canvasSelection: canvas.selection,
      });
      
      // Only pan with Alt/middle-click AND when clicking empty space (not an object)
      if ((e.e.altKey || e.e.button === 1) && !e.target) {
        e.e.preventDefault();
        isPanningRef.current = true;
        lastPanPointRef.current = { x: e.e.clientX, y: e.e.clientY };
        canvas.defaultCursor = 'grabbing';
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    const handleMouseMove = (e: any) => {
      if (isPanningRef.current && lastPanPointRef.current) {
        const delta = {
          x: e.e.clientX - lastPanPointRef.current.x,
          y: e.e.clientY - lastPanPointRef.current.y,
        };
        canvas.relativePan({ x: delta.x, y: delta.y } as any);
        lastPanPointRef.current = { x: e.e.clientX, y: e.e.clientY };
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        canvas.defaultCursor = 'default';
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas]);

  useEffect(() => {
    if (!canvas || !canvas.upperCanvasEl) return;

    canvas.clear();
    canvas.backgroundColor = COLORS.facility.background;

    // Draw facility boundary
    const facilityBoundary = new Rect({
      left: 0,
      top: 0,
      width: gridWidth * CELL_SIZE,
      height: gridHeight * CELL_SIZE,
      fill: 'transparent',
      stroke: COLORS.facility.stroke,
      strokeWidth: COLORS.facility.strokeWidth,
      selectable: editMode === 'facility',
      hasControls: editMode === 'facility',
      lockRotation: true,
      evented: editMode === 'facility',
      data: { type: 'facility', id: 'facility-boundary' },
    } as any);

    canvas.add(facilityBoundary);

    // Draw grid lines
    for (let i = 0; i <= gridWidth; i++) {
      const line = new Line([i * CELL_SIZE, 0, i * CELL_SIZE, gridHeight * CELL_SIZE], {
        stroke: COLORS.facility.grid,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    for (let i = 0; i <= gridHeight; i++) {
      const line = new Line([0, i * CELL_SIZE, gridWidth * CELL_SIZE, i * CELL_SIZE], {
        stroke: COLORS.facility.grid,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Render in proper z-order (back to front):
    // 1. Zones (background containers)
    // 2. Rooms (containers)
    // 3. Outside Areas (containers)
    // 4. Lanes (horizontal containers)
    // 5. Gates (entry/exit)
    // 6. Storage (content)
    // 7. Stations (content - on top)

    // Render zones first (background)
    zones.forEach((zone) => {
      const zoneX = (zone.grid_x || 0) * CELL_SIZE;
      const zoneY = (zone.grid_y || 0) * CELL_SIZE;
      const zoneWidth = (zone.grid_width || 6) * CELL_SIZE;
      const zoneHeight = (zone.grid_height || 6) * CELL_SIZE;
      const opacity = editMode === 'zone' ? 1 : 0.2;

      const zoneRect = new Rect({
        left: 0,
        top: 0,
        width: zoneWidth,
        height: zoneHeight,
        fill: zone.color || COLORS.zones.fill,
        stroke: COLORS.zones.stroke,
        strokeWidth: COLORS.zones.strokeWidth,
        opacity,
        rx: 4,
        ry: 4,
      });

      const zoneText = new FabricText(zone.name, {
        left: zoneWidth / 2 - 25,
        top: zoneHeight / 2 - 8,
        fontSize: 12,
        fill: COLORS.zones.text,
        fontWeight: 'bold',
      });

      const zoneGroup = new Group([zoneRect, zoneText], {
        left: zoneX,
        top: zoneY,
        selectable: editMode === 'zone',
        hasControls: editMode === 'zone',
        lockRotation: true,
        evented: editMode === 'zone',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'zone' ? 'move' : 'default',
        moveCursor: 'move',
        data: { type: 'zone', id: zone.id, originalData: zone },
      } as any);

      canvas.add(zoneGroup);
    });

    // Render rooms
    rooms.forEach((room) => {
      const roomX = (room.grid_x || 0) * CELL_SIZE;
      const roomY = (room.grid_y || 0) * CELL_SIZE;
      const roomWidth = (room.grid_width || 10) * CELL_SIZE;
      const roomHeight = (room.grid_height || 10) * CELL_SIZE;
      const opacity = editMode === 'room' ? 1 : 0.2;

      const roomRect = new Rect({
        left: 0,
        top: 0,
        width: roomWidth,
        height: roomHeight,
        fill: room.color || COLORS.rooms.fill,
        stroke: COLORS.rooms.stroke,
        strokeWidth: COLORS.rooms.strokeWidth,
        opacity,
        rx: 4,
        ry: 4,
      });

      const roomText = new FabricText(room.name, {
        left: roomWidth / 2 - 30,
        top: roomHeight / 2 - 8,
        fontSize: 14,
        fill: COLORS.rooms.text,
        fontWeight: 'bold',
      });

      const roomGroup = new Group([roomRect, roomText], {
        left: roomX,
        top: roomY,
        selectable: editMode === 'room',
        hasControls: editMode === 'room',
        lockRotation: true,
        evented: editMode === 'room',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'room' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'room', 
          id: room.id, 
          originalData: room,
          baseGridWidth: room.grid_width || 10,
          baseGridHeight: room.grid_height || 10,
        },
      } as any);

      console.log(`🏠 Created room "${room.name}":`, {
        id: room.id,
        selectable: editMode === 'room',
        evented: editMode === 'room',
        hasControls: editMode === 'room',
        currentEditMode: editMode,
      });

      canvas.add(roomGroup);
    });

    // Render outside areas
    outsideAreas.forEach((area) => {
      const areaX = (area.grid_x || 0) * CELL_SIZE;
      const areaY = (area.grid_y || 0) * CELL_SIZE;
      const areaWidth = (area.grid_width || 8) * CELL_SIZE;
      const areaHeight = (area.grid_height || 8) * CELL_SIZE;
      const opacity = editMode === 'outside' ? 1 : 0.2;

      const areaRect = new Rect({
        left: 0,
        top: 0,
        width: areaWidth,
        height: areaHeight,
        fill: area.color || COLORS.outside.fill,
        stroke: COLORS.outside.stroke,
        strokeWidth: COLORS.outside.strokeWidth,
        opacity,
        rx: 2,
        ry: 2,
      });

      const areaText = new FabricText(area.name, {
        left: areaWidth / 2 - 30,
        top: areaHeight / 2 - 8,
        fontSize: 13,
        fill: COLORS.outside.text,
        fontWeight: 'bold',
      });

      const areaGroup = new Group([areaRect, areaText], {
        left: areaX,
        top: areaY,
        selectable: editMode === 'outside',
        hasControls: editMode === 'outside',
        lockRotation: true,
        evented: editMode === 'outside',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'outside' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'outside', 
          id: area.id, 
          originalData: area,
          baseGridWidth: area.grid_width || 8,
          baseGridHeight: area.grid_height || 8,
        },
      } as any);

      canvas.add(areaGroup);
    });

    // Render lanes
    lanes.forEach((lane) => {
      const laneX = (lane.grid_position_x || 0) * CELL_SIZE;
      const laneY = (lane.grid_position_y || 0) * CELL_SIZE;
      const laneWidth = (lane.grid_width || 20) * CELL_SIZE;
      const laneHeight = (lane.grid_height || 5) * CELL_SIZE;
      const opacity = editMode === 'lane' ? 1 : 0.3;

      const laneRect = new Rect({
        left: 0,
        top: 0,
        width: laneWidth,
        height: laneHeight,
        fill: COLORS.lanes.fill,
        stroke: COLORS.lanes.stroke,
        strokeWidth: COLORS.lanes.strokeWidth,
        opacity,
      });

      const laneText = new FabricText(lane.name || `Lane ${lane.position_order}`, {
        left: 10,
        top: laneHeight / 2 - 7,
        fontSize: 16,
        fill: COLORS.lanes.text,
        fontWeight: 'bold',
      });

      const laneGroup = new Group([laneRect, laneText], {
        left: laneX,
        top: laneY,
        selectable: editMode === 'lane',
        hasControls: editMode === 'lane',
        lockRotation: true,
        lockScalingX: false,
        lockMovementX: false,
        evented: editMode === 'lane',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'lane' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'lane', 
          id: lane.id, 
          originalData: lane,
          baseGridWidth: lane.grid_width || 20,
          baseGridHeight: lane.grid_height || 5,
        },
      } as any);

      canvas.add(laneGroup);
    });

    // Render gates
    gates.forEach((gate) => {
      const gateX = (gate.grid_x || 0) * CELL_SIZE;
      const gateY = (gate.grid_y || 0) * CELL_SIZE;
      const gateWidth = (gate.grid_width || 3) * CELL_SIZE;
      const gateHeight = (gate.grid_height || 10) * CELL_SIZE;
      const opacity = editMode === 'gate' ? 1 : 0.3;

      const gateRect = new Rect({
        left: 0,
        top: 0,
        width: gateWidth,
        height: gateHeight,
        fill: COLORS.gates.fill,
        stroke: COLORS.gates.stroke,
        strokeWidth: COLORS.gates.strokeWidth,
        opacity,
      });

      const gateText = new FabricText(gate.name || 'Gate', {
        left: gateWidth / 2 - 6,
        top: 10,
        fontSize: 14,
        fill: COLORS.gates.text,
        fontWeight: 'bold',
        angle: 90,
      });

      const gateGroup = new Group([gateRect, gateText], {
        left: gateX,
        top: gateY,
        selectable: editMode === 'gate',
        hasControls: editMode === 'gate',
        lockRotation: true,
        evented: editMode === 'gate',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'gate' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'gate', 
          id: gate.id, 
          originalData: gate,
          baseGridWidth: gate.grid_width || 3,
          baseGridHeight: gate.grid_height || 10,
        },
      } as any);

      canvas.add(gateGroup);
    });

    // Render stations
    stations.forEach((station) => {
      const stationX = (station.grid_position_x || 0) * CELL_SIZE;
      const stationY = (station.grid_position_y || 0) * CELL_SIZE;
      const stationWidth = (station.grid_width || 4) * CELL_SIZE;
      const stationHeight = (station.grid_height || 3) * CELL_SIZE;
      const opacity = editMode === 'station' ? 1 : 0.3;

      const stationRect = new Rect({
        left: 0,
        top: 0,
        width: stationWidth,
        height: stationHeight,
        fill: COLORS.stations.fill,
        stroke: COLORS.stations.stroke,
        strokeWidth: COLORS.stations.strokeWidth,
        opacity,
        rx: 4,
        ry: 4,
      });

      const stationText = new FabricText(station.name || 'Station', {
        left: stationWidth / 2 - 20,
        top: stationHeight / 2 - 8,
        fontSize: 13,
        fill: COLORS.stations.text,
        fontWeight: 'bold',
      });

      const stationGroup = new Group([stationRect, stationText], {
        left: stationX,
        top: stationY,
        selectable: editMode === 'station',
        hasControls: editMode === 'station',
        lockRotation: true,
        evented: editMode === 'station',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'station' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'station', 
          id: station.id, 
          originalData: station,
          baseGridWidth: station.grid_width || 4,
          baseGridHeight: station.grid_height || 3,
        },
      } as any);

      canvas.add(stationGroup);
    });

    // Render storage locations
    storageLocations.forEach((storage) => {
      const storageX = (storage.grid_position_x || 0) * CELL_SIZE;
      const storageY = (storage.grid_position_y || 0) * CELL_SIZE;
      const storageWidth = (storage.grid_width || 3) * CELL_SIZE;
      const storageHeight = (storage.grid_height || 3) * CELL_SIZE;
      const opacity = editMode === 'storage' ? 1 : 0.3;

      const storageRect = new Rect({
        left: 0,
        top: 0,
        width: storageWidth,
        height: storageHeight,
        fill: COLORS.storage.fill,
        stroke: COLORS.storage.stroke,
        strokeWidth: COLORS.storage.strokeWidth,
        opacity,
        rx: 2,
        ry: 2,
      });

      const storageText = new FabricText(storage.name, {
        left: storageWidth / 2 - 20,
        top: storageHeight / 2 - 8,
        fontSize: 11,
        fill: COLORS.storage.text,
        fontWeight: 'bold',
      });

      const storageGroup = new Group([storageRect, storageText], {
        left: storageX,
        top: storageY,
        selectable: editMode === 'storage',
        hasControls: editMode === 'storage',
        lockRotation: true,
        evented: editMode === 'storage',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'storage' ? 'move' : 'default',
        moveCursor: 'move',
        data: { 
          type: 'storage', 
          id: storage.id, 
          originalData: storage,
          baseGridWidth: storage.grid_width || 3,
          baseGridHeight: storage.grid_height || 3,
        },
      } as any);

      canvas.add(storageGroup);
    });

    canvas.renderAll();
  }, [canvas, gridWidth, gridHeight, gates, lanes, stations, rooms, outsideAreas, storageLocations, zones, editMode]);

  // Clear selection when switching to incompatible edit mode
  useEffect(() => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject() as any;
    console.log('🔀 EDIT MODE CHANGED:', {
      newEditMode: editMode,
      hasActiveObject: !!activeObject,
      activeObjectType: activeObject?.data?.type,
      willClear: activeObject?.data?.type && activeObject.data.type !== editMode && editMode !== 'view',
    });
    
    if (activeObject?.data?.type && activeObject.data?.type !== editMode && editMode !== 'view') {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [canvas, editMode]);

  const handleZoomIn = () => {
    if (canvas) {
      const newZoom = Math.min(zoom + 0.1, 1.5); // Max 150%
      canvas.setZoom(newZoom);
      setZoom(newZoom);
      canvas.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (canvas) {
      const newZoom = Math.max(zoom - 0.1, 0.1); // Min 10%
      canvas.setZoom(newZoom);
      setZoom(newZoom);
      canvas.renderAll();
    }
  };

  const handleResetZoom = () => {
    if (canvas) {
      canvas.setZoom(1.0); // Reset to 100%
      canvas.viewportTransform = [1, 0, 0, 1, 100, 100];
      setZoom(1.0);
      canvas.renderAll();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomToFit} title="Fit to view">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetZoom}>
          Reset ({Math.round(zoom * 100)}%)
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        💡 Hold Alt or Opt on Mac and click and drag with mouse to pan • Click and drag to move elements • Use handles to resize
      </div>
      <div className="overflow-auto border border-border rounded-lg shadow-lg bg-background">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
