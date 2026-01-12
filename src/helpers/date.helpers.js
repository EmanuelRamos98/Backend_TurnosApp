export const getDiasDelMes = (mes, año) => {
    const fecha = new Date(año, mes - 1, 1);

    const dias = [];

    while (fecha.getMonth() === mes - 1) {
        dias.push(new Date(fecha));
        fecha.setDate(fecha.getDate() + 1);
    }

    return dias;
};

export const generarSlots = (horaInicio, horaFin, duracionMinutos = 30) => {
    const slots = [];

    let [h, m] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);

    let minutosActuales = h * 60 + m;
    const minutosFin = hFin * 60 + mFin;

    while (minutosActuales < minutosFin) {
        const horas = Math.floor(minutosActuales / 60)
            .toString()
            .padStart(2, '0');
        const minutos = (minutosActuales % 60).toString().padStart(2, '0');

        slots.push(`${horas}:${minutos}`);
        minutosActuales += duracionMinutos;
    }

    return slots;
};
