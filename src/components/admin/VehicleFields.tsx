import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from './vehicleData';

interface VehicleFieldsProps {
  make: string;
  model: string;
  year: string;
  registration: string;
  onMakeChange: (resolved: string) => void;
  onModelChange: (resolved: string) => void;
  onYearChange: (v: string) => void;
  onRegistrationChange: (v: string) => void;
  optional?: boolean;
}

export default function VehicleFields({
  make, model, year, registration,
  onMakeChange, onModelChange, onYearChange, onRegistrationChange,
  optional = false,
}: VehicleFieldsProps) {
  const [selectedMake, setSelectedMake] = useState(() =>
    make && VEHICLE_MAKES.includes(make as any) ? make : make ? '__other__' : ''
  );
  const [selectedModel, setSelectedModel] = useState(() => {
    if (!make) return '';
    const models = VEHICLE_MODELS[make] || [];
    return models.includes(model) ? model : model ? '__other__' : '';
  });

  const isOtherMake = selectedMake === '__other__';
  const isOtherModel = selectedModel === '__other__';
  const models = (!isOtherMake && selectedMake) ? (VEHICLE_MODELS[selectedMake] || []) : [];

  const handleSelectMake = (v: string) => {
    setSelectedMake(v);
    setSelectedModel('');
    onModelChange('');
    if (v === '__other__') {
      onMakeChange('');
    } else {
      onMakeChange(v);
    }
  };

  const handleSelectModel = (v: string) => {
    setSelectedModel(v);
    if (v === '__other__') {
      onModelChange('');
    } else {
      onModelChange(v);
    }
  };

  const labelClass = optional ? 'text-muted-foreground' : '';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Make */}
      <div>
        <Label className={labelClass}>Make</Label>
        <Select value={selectedMake} onValueChange={handleSelectMake}>
          <SelectTrigger>
            <SelectValue placeholder="Select make" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {VEHICLE_MAKES.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
            <SelectItem value="__other__">Other…</SelectItem>
          </SelectContent>
        </Select>
        {isOtherMake && (
          <Input
            className="mt-1"
            placeholder="Enter make"
            value={make}
            onChange={e => onMakeChange(e.target.value)}
          />
        )}
      </div>

      {/* Model */}
      <div>
        <Label className={labelClass}>Model</Label>
        {models.length > 0 ? (
          <>
            <Select value={selectedModel} onValueChange={handleSelectModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {models.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                <SelectItem value="__other__">Other…</SelectItem>
              </SelectContent>
            </Select>
            {isOtherModel && (
              <Input
                className="mt-1"
                placeholder="Enter model"
                value={model}
                onChange={e => onModelChange(e.target.value)}
              />
            )}
          </>
        ) : (
          <Input
            placeholder={selectedMake ? 'Enter model' : 'Select make first'}
            value={model}
            onChange={e => onModelChange(e.target.value)}
            disabled={!selectedMake}
          />
        )}
      </div>

      {/* Year */}
      <div>
        <Label className={labelClass}>Year</Label>
        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {VEHICLE_YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Registration */}
      <div>
        <Label className={labelClass}>Registration</Label>
        <Input
          className="uppercase"
          placeholder="e.g. AB 12345"
          value={registration}
          onChange={e => onRegistrationChange(e.target.value)}
        />
      </div>
    </div>
  );
}
