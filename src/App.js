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
  ReferenceLine,
  Area
} from 'recharts';
import { Settings, RefreshCcw, Info, TrendingDown, TrendingUp } from 'lucide-react';

const FiscalLifecycleSim = () => {
  // --- ESTADO DE LOS CONTROLES (SIMULACIÓN) ---
  const [retirementAge, setRetirementAge] = useState(65);
  const [taxPressure, setTaxPressure] = useState(100); // Porcentaje (100% es el base)
  const [pensionLevel, setPensionLevel] = useState(100); // Porcentaje (100% es el base)
  const [educationSpend, setEducationSpend] = useState(100);

  // --- GENERACIÓN DE DATOS (Lógica portada de Python a JS) ---
  const data = useMemo(() => {
    const result = [];
    for (let age = 0; age <= 100; age++) {
      // 1. GASTOS (Positivos)
      
      // Educación: Pico en juventud
      // Python: 2800 * np.exp(-(edades - 10)**2 / (2 * 8**2))
      const educacionBase = 2800 * (educationSpend / 100);
      let educacion = educacionBase * Math.exp(-Math.pow(age - 10, 2) / (2 * Math.pow(8, 2)));
      if (educacion < 10) educacion = 0;

      // Sanidad: Forma de U
      // Python: 500 + 30 * ((edades - 30)**2 / 45) ... + ajuste vejez
      let sanidad = 500 + 30 * (Math.pow(age - 30, 2) / 45);
      if (age > 80) sanidad += 1500;

      // Pensiones: Depende de la edad de jubilación seleccionada
      let pensiones = 0;
      if (age >= retirementAge) {
        const pensionBase = 17000 * (pensionLevel / 100);
        // Ajustamos el pico de la curva según donde empiece la jubilación
        const peakAge = retirementAge + 13; 
        pensiones = pensionBase * Math.exp(-Math.pow(age - peakAge, 2) / (2 * Math.pow(15, 2)));
      }

      // Dependencia: Solo > 75
      let dependencia = 0;
      if (age > 75) {
        dependencia = 3000 * Math.pow((age - 75) / 25, 2);
      }

      // Otros (Desempleo, etc)
      let otros = 0;
      if (age > 20 && age < retirementAge) {
        otros = 1200;
      }

      // 2. IMPUESTOS (Negativos)
      // Python: -12500 * np.exp(-(edades - 45)**2 / (2 * 14**2))
      const taxBase = -12500 * (taxPressure / 100);
      let impuestos = taxBase * Math.exp(-Math.pow(age - 45, 2) / (2 * Math.pow(14, 2)));
      
      // Ajuste: Jubilados pagan menos (pero pagan algo)
      if (age >= retirementAge) {
        impuestos = impuestos * 0.35;
      }

      // 3. SALDO NETO
      const totalGasto = educacion + sanidad + pensiones + dependencia + otros;
      const saldoNeto = totalGasto + impuestos; // impuestos ya es negativo

      result.push({
        age,
        educacion,
        sanidad,
        pensiones,
        dependencia,
        otros,
        impuestos,
        saldoNeto,
        totalGasto // Para tooltips
      });
    }
    return result;
  }, [retirementAge, taxPressure, pensionLevel, educationSpend]);

  // Cálculos totales para el resumen
  const totalDeficit = data.reduce((acc, curr) => acc + curr.saldoNeto, 0);
  const isSustainable = totalDeficit < 0; // Simplificación burda: si sobra dinero es sostenible (en este modelo de un año)

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-gray-800 mb-2">Edad: {label} años</p>
          <div className="space-y-1">
            <p className="text-blue-600">Pensiones: {formatMoney(d.pensiones)}</p>
            <p className="text-red-500">Sanidad: {formatMoney(d.sanidad)}</p>
            <p className="text-green-600">Educación: {formatMoney(d.educacion)}</p>
            <p className="text-yellow-500">Dependencia: {formatMoney(d.dependencia)}</p>
            <div className="border-t border-gray-200 my-1"></div>
            <p className="text-gray-500">Impuestos: {formatMoney(d.impuestos)}</p>
            <div className="border-t border-gray-200 my-1"></div>
            <p className={`font-bold ${d.saldoNeto > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Saldo Neto: {formatMoney(d.saldoNeto)}
            </p>
            <p className="text-xs text-gray-400 italic mt-1">
              {d.saldoNeto > 0 ? '(Recibe más de lo que aporta)' : '(Aporta más de lo que recibe)'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- PANEL LATERAL DE CONTROLES --- */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto shadow-sm z-10">
        <div className="flex items-center gap-2 mb-6 text-blue-800">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-bold">Simulador 2050</h1>
        </div>

        <div className="space-y-8">
          
          {/* Control Edad Jubilación */}
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              Edad de Jubilación
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{retirementAge} años</span>
            </label>
            <input 
              type="range" min="60" max="75" step="1"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mueve a la derecha para retrasar el inicio del gasto masivo en pensiones.
            </p>
          </div>

          {/* Control Nivel de Pensiones */}
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              Cuantía de Pensiones
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{pensionLevel}%</span>
            </label>
            <input 
              type="range" min="50" max="150" step="5"
              value={pensionLevel}
              onChange={(e) => setPensionLevel(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ajusta la generosidad del sistema (tasa de reemplazo).
            </p>
          </div>

          {/* Control Presión Fiscal */}
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              Presión Fiscal (Impuestos)
              <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">{taxPressure}%</span>
            </label>
            <input 
              type="range" min="50" max="150" step="5"
              value={taxPressure}
              onChange={(e) => setTaxPressure(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Aumenta la recaudación (barras grises) para intentar cubrir el gasto.
            </p>
          </div>

          {/* Resumen Rápido */}
          <div className={`p-4 rounded-lg border ${isSustainable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isSustainable ? <TrendingUp className="text-green-600 w-5 h-5"/> : <TrendingDown className="text-red-600 w-5 h-5"/>}
              <h3 className="font-bold text-sm">Balance del Sistema</h3>
            </div>
            <p className="text-xs mb-2">
              Este indicador suma el saldo neto de TODAS las edades simuladas.
            </p>
            <p className={`text-lg font-mono font-bold ${totalDeficit > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {totalDeficit > 0 ? 'DÉFICIT NETO' : 'SUPERÁVIT NETO'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Nota: Esto es un modelo simplificado de ciclo vital, no una balanza fiscal completa del Estado.
            </p>
          </div>
          
          <button 
            onClick={() => {setRetirementAge(65); setTaxPressure(100); setPensionLevel(100); setEducationSpend(100);}}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Resetear Valores
          </button>

        </div>
      </div>

      {/* --- ÁREA DEL GRÁFICO --- */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Ciclo de Vida Fiscal: España 2050</h2>
          <p className="text-gray-500 text-sm">Visualización interactiva basada en metodología de Cuentas de Transferencia Nacionales (NTA).</p>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              stackOffset="sign"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="age" 
                label={{ value: 'Edad (Años)', position: 'insideBottomRight', offset: -10 }} 
                tick={{fontSize: 12}}
                minTickGap={10}
              />
              <YAxis 
                label={{ value: 'Euros (Estimación)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value/1000}k`}
                tick={{fontSize: 12}}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <ReferenceLine y={0} stroke="#000" />

              {/* Barras de GASTOS (Apiladas) stackId="a" */}
              <Bar dataKey="otros" name="Desempleo/Otros" stackId="a" fill="#9CA3AF" />
              <Bar dataKey="dependencia" name="Dependencia" stackId="a" fill="#F59E0B" />
              <Bar dataKey="educacion" name="Educación" stackId="a" fill="#10B981" />
              <Bar dataKey="sanidad" name="Sanidad" stackId="a" fill="#EF4444" />
              <Bar dataKey="pensiones" name="Pensiones" stackId="a" fill="#3B82F6" />

              {/* Barras de IMPUESTOS (Separadas o stackId diferente para que bajen) */}
              {/* Nota: Como el valor es negativo, recharts lo dibuja hacia abajo automáticamente */}
              <Bar dataKey="impuestos" name="Impuestos" stackId="b" fill="#94a3b8" />

              {/* Línea de SALDO NETO */}
              <Line 
                type="monotone" 
                dataKey="saldoNeto" 
                name="Saldo Neto" 
                stroke="#7f1d1d" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 8 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded border border-blue-100">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Cómo leer este gráfico:</strong> Las barras de colores (arriba) muestran lo que el Estado gasta en una persona de esa edad. 
            Las barras grises (abajo) muestran lo que esa persona paga en impuestos. La <span className="text-red-800 font-bold">línea roja</span> es el resultado neto. 
            Observa cómo el "hueco" de impuestos entre los 30-60 años debe financiar las montañas de gasto en la infancia y, sobre todo, en la vejez.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FiscalLifecycleSim;
