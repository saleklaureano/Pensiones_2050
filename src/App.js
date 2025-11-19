import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Settings, RefreshCcw, Info, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

const FiscalLifecycleSim = () => {
  // --- ESTADO DE LOS CONTROLES ---
  const [retirementAge, setRetirementAge] = useState(65);
  const [taxPressure, setTaxPressure] = useState(100);
  const [pensionLevel, setPensionLevel] = useState(100);
  const [educationSpend, setEducationSpend] = useState(100);
  const [showControls, setShowControls] = useState(true); 

  // --- GENERACIÓN DE DATOS ---
  const data = useMemo(() => {
    const result = [];
    for (let age = 0; age <= 100; age++) {
      // 1. GASTOS
      const educacionBase = 2800 * (educationSpend / 100);
      let educacion = educacionBase * Math.exp(-Math.pow(age - 10, 2) / (2 * Math.pow(8, 2)));
      if (educacion < 10) educacion = 0;

      let sanidad = 500 + 30 * (Math.pow(age - 30, 2) / 45);
      if (age > 80) sanidad += 1500;

      let pensiones = 0;
      if (age >= retirementAge) {
        const pensionBase = 17000 * (pensionLevel / 100);
        const peakAge = retirementAge + 13; 
        pensiones = pensionBase * Math.exp(-Math.pow(age - peakAge, 2) / (2 * Math.pow(15, 2)));
      }

      let dependencia = 0;
      if (age > 75) {
        dependencia = 3000 * Math.pow((age - 75) / 25, 2);
      }

      let otros = 0;
      if (age > 20 && age < retirementAge) {
        otros = 1200;
      }

      // 2. IMPUESTOS
      const taxBase = -12500 * (taxPressure / 100);
      let impuestos = taxBase * Math.exp(-Math.pow(age - 45, 2) / (2 * Math.pow(14, 2)));
      
      if (age >= retirementAge) {
        impuestos = impuestos * 0.35;
      }

      // 3. SALDO NETO
      const totalGasto = educacion + sanidad + pensiones + dependencia + otros;
      const saldoNeto = totalGasto + impuestos;

      result.push({
        age,
        educacion,
        sanidad,
        pensiones,
        dependencia,
        otros,
        impuestos,
        saldoNeto
      });
    }
    return result;
  }, [retirementAge, taxPressure, pensionLevel, educationSpend]);

  const totalDeficit = data.reduce((acc, curr) => acc + curr.saldoNeto, 0);
  const isSustainable = totalDeficit < 0;

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur p-3 border border-gray-200 shadow-xl rounded-lg text-xs sm:text-sm z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">Edad: {label} años</p>
          <div className="space-y-1">
            <p className="text-blue-600 flex justify-between gap-4"><span>Pensiones:</span> <span>{formatMoney(d.pensiones)}</span></p>
            <p className="text-red-500 flex justify-between gap-4"><span>Sanidad:</span> <span>{formatMoney(d.sanidad)}</span></p>
            <p className="text-green-600 flex justify-between gap-4"><span>Educación:</span> <span>{formatMoney(d.educacion)}</span></p>
            <p className="text-gray-500 flex justify-between gap-4"><span>Impuestos:</span> <span>{formatMoney(d.impuestos)}</span></p>
            <div className="border-t border-gray-200 my-1"></div>
            <p className={`font-bold flex justify-between gap-4 ${d.saldoNeto > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span>Saldo Neto:</span> <span>{formatMoney(d.saldoNeto)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- PANEL DE CONTROLES --- */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 shadow-sm z-20 flex-shrink-0">
        
        <div 
          className="p-4 flex items-center justify-between cursor-pointer md:cursor-default bg-blue-50 md:bg-white"
          onClick={() => window.innerWidth < 768 && setShowControls(!showControls)}
        >
          <div className="flex items-center gap-2 text-blue-800">
            <Settings className="w-5 h-5" />
            <h1 className="text-lg font-bold">Simulador 2050</h1>
          </div>
          <div className="md:hidden text-blue-600">
            {showControls ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>

        <div className={`${showControls ? 'block' : 'hidden'} md:block p-6 pt-2 overflow-y-auto md:h-[calc(100vh-4rem)]`}>
          <div className="space-y-6">
            
            {/* Control Edad Jubilación */}
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                Edad Jubilación
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{retirementAge} años</span>
              </label>
              <input 
                type="range" min="60" max="75" step="1"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Control Nivel Pensiones */}
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                Nivel Pensiones
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{pensionLevel}%</span>
              </label>
              <input 
                type="range" min="50" max="150" step="5"
                value={pensionLevel}
                onChange={(e) => setPensionLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Control Presión Fiscal */}
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                Impuestos
                <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">{taxPressure}%</span>
              </label>
              <input 
                type="range" min="50" max="150" step="5"
                value={taxPressure}
                onChange={(e) => setTaxPressure(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
              />
            </div>

            {/* Resumen Balance */}
            <div className={`p-4 rounded-lg border ${isSustainable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {isSustainable ? <TrendingUp className="text-green-600 w-4 h-4"/> : <TrendingDown className="text-red-600 w-4 h-4"/>}
                <h3 className="font-bold text-sm">Balance Neto</h3>
              </div>
              <p className={`text-xl font-mono font-bold ${totalDeficit > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {totalDeficit > 0 ? 'DÉFICIT' : 'SUPERÁVIT'}
              </p>
            </div>
            
            <button 
              onClick={() => {setRetirementAge(65); setTaxPressure(100); setPensionLevel(100);}}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors border border-gray-300"
            >
              <RefreshCcw className="w-3 h-3" /> Resetear
            </button>
          </div>
        </div>
      </div>

      {/* --- ÁREA DEL GRÁFICO --- */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-8 overflow-hidden bg-white">
        <div className="mb-4 px-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Ciclo Fiscal: España 2050</h2>
          <p className="text-gray-500 text-xs md:text-sm mt-1">Modelo NTA Interactivo</p>
        </div>

        {/* CORRECCIÓN AQUÍ: Usamos h-[400px] explícito en móvil, y flex-1 en escritorio */}
        <div className="w-full h-[400px] md:h-auto md:flex-1 bg-white rounded-xl border border-gray-100 p-1 sm:p-4 shadow-sm relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              stackOffset="sign"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="age" 
                tick={{fontSize: 10}}
                interval={10}
                label={{ value: 'Edad', position: 'insideBottom', offset: -5, fontSize: 12 }} 
              />
              <YAxis 
                tickFormatter={(value) => `${value/1000}k`}
                tick={{fontSize: 10}}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} iconSize={8} />
              <ReferenceLine y={0} stroke="#000" />

              <Bar dataKey="otros" name="Otros" stackId="a" fill="#9CA3AF" />
              <Bar dataKey="dependencia" name="Dependencia" stackId="a" fill="#F59E0B" />
              <Bar dataKey="educacion" name="Educación" stackId="a" fill="#10B981" />
              <Bar dataKey="sanidad" name="Sanidad" stackId="a" fill="#EF4444" />
              <Bar dataKey="pensiones" name="Pensiones" stackId="a" fill="#3B82F6" />
              <Bar dataKey="impuestos" name="Impuestos" stackId="b" fill="#94a3b8" />

              <Line 
                type="monotone" 
                dataKey="saldoNeto" 
                name="Saldo Neto" 
                stroke="#7f1d1d" 
                strokeWidth={2} 
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            La <span className="text-red-800 font-bold">línea roja</span> indica el saldo neto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FiscalLifecycleSim;
