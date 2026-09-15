import Icon from "/EvolvePosIcon.svg"

function ButterflyLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      {/* Contenedor con efecto flotante/rebote y la clase jello definida en tus estilos */}
      <div className="animate-bounce">
        <img
          src={Icon}
          className="jello drop-shadow-[0_0_25px_rgba(41,161,255,0.4)]"
          width={200}
          height={200}
          alt="Evolve POS Icon"
        />
      </div>
    </div>
  )
}

export default ButterflyLoading
