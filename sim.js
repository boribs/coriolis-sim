/*
 * Se trata de una simulación del efecto Coriolis.
 * Hay una viga giratoria en el centro y de uno de sus
 * extremos sale un proyectil.
 * El usuario decide cuándo dispararlo (ESPACIO).
 * La bola regresa automáticamente a su posición original
 * al extremo de la viga al llegar al borde de la pantalla,
 * pero puede ser reiniciada manualmente (R).
 *
 * La simulación contiene dos vistas, una "desde arriba"
 * y otra desde la perspectiva de la persona que "lanza"
 * el proyectil.
 *
 * Ambas vistas usan un mismo sistema de coordenadas global,
 * solamente proyectan los objetos según la perspectiva.
 */

// Recuperación de áreas de dibujo y sus respectivos contextos
// Es a través del contexto que dibujas cosas en el canvas
const canvas1 = document.getElementById('canvas1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

// Constantes en los dibujos
const backgroundColor = "green";
const lineColor = "darkgrey";
const lineWidth = 20;
const projRad = 10;

// Centro del canvas
let wh = canvas1.width / 2;
let hh = canvas1.height / 2;

class Projectile {
    constructor(speed, color) {
        this.x = null;
        this.y = null;
        this.speed = speed;
        this.dirVec = null;
        this.launched = false;
        this.color = color;
    }

    // método privado - no se puede acceder
    // desde fuera de la clase
    /**
     * Calcula el vector unitario de dirección
     * del proyectil desde su posición actual al
     * centro.
     */
    #vecToCenter(k) {
        const vec = [wh - this.x, hh - this.y];
        const mod = Math.sqrt(vec[0]**2 + vec[1]**2);
        return [vec[0] / mod, vec[1] / mod];
    }

    /**
     * Actualiza la posición del proyectil según su estado.
     * Si no se ha lanzado: Sigue la viga giratoria.
     * Si se ha lanzado: Avanza según el vector de dirección.
     */
    update(delta, parentX, parentY, canvas) {
        if (!this.launched) {
            this.x = parentX;
            this.y = parentY;
        } else {
            // Determina siguiente posición según la velocidad
            // y el tiempo entre frames.
            // Avanza lo correspondiente al tiempo transcurrido
            // (delta) en segundos.
            this.x += delta * this.dirVec[0] * this.speed;
            this.y += delta * this.dirVec[1] * this.speed;
        }

        // Cecar si se salió de la pantalla
        if ((this.x < 0 || this.x > canvas.width) ||
            (this.y < 0 || this.y > canvas.height)) {
                this.reset();
        }
    }

    /**
     * Cambia el estado de "no lanzado" a "lanzado"
     * y calcula el vector de dirección.
     */
    launch() {
        if (!this.launched) {
            this.dirVec = this.#vecToCenter(this.speed);
        }
        this.launched = true;
    }

    /**
     * Cambia el estado de "lanzado" a "no lanzado".
     * La función update() es la que regresa la posición.
     */
    reset() {
        this.launched = false;
    }

    /**
     * Dibuja el proyectil (la bola) en un área de dibujo.
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, projRad, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * Cambia el tamaño de un canvas para abarcar
 * la mitad de la pantalla disponible.
 */
function resize(canvas) {
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerWidth / 2;
    wh = canvas.width / 2;
    hh = canvas.height / 2;
}

/**
 * Dibuja el estado actual de la simulación "desde arriba".
 *
 * Esta función y "frontView" solamente muestran un instantáneo
 * de la simulación. Se ve fluido porque se llaman cada frame,
 * pero no alteran el comportamiento ni de la viga, ni la bola.
 */
function topView(delta, angle, ball, canvas, ctx) {
    resize(canvas);

    // dibujar el fondo
    ctx1.fillStyle = backgroundColor;
    ctx1.fillRect(0, 0, canvas.width, canvas.height);

    const K = 200;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;

    // calcular las posiciones de los extremos de la viga
    const ax = Math.cos(angle) * K + wh,
          ay = Math.sin(angle) * K + hh;
    const bx = Math.cos(angle + Math.PI) * K + wh,
          by = Math.sin(angle + Math.PI) * K + hh;

    // dibuja la viga como una línea gruesa
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // dibuja los círculos en los extremos de la viga
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(ax, ay, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 20, 0, 2 * Math.PI);
    ctx.fill();

    // dibuja la bola
    ball.draw(ctx);

    // regresa la posición del extremo de la viga
    // del cual se lanza la bola.
    return [ax, ay];
}

/**
 * Muestra un instantáneo de la simulación visto
 * desde la perspectiva de donde se lanza el
 * proyectil.
 *
 * No altera el funcionamiento de la simulación.
 */
function frontView(cam, ball, canvas, ctx) {
    resize(canvas);

    let a = [wh, hh];
    let x = [ball.x, ball.y];

    // Para mostrar la perspectiva hay que transformar
    // los puntos de manera que la bola esté al centro
    // y la viga quede mirando hacia arriba.

    // Mover los puntos al centro (respecto a la cámara).
    a[0] -= cam[0];
    a[1] -= cam[1];
    x[0] -= cam[0];
    x[1] -= cam[1];
    cam[0] = 0;
    cam[1] = 0;

    // Rotar los puntos respecto a la viga.
    let rot = function(theta, x, y) {
        return [
            (x * Math.cos(theta)) - (y * Math.sin(theta)),
            (x * Math.sin(theta)) + (y * Math.cos(theta)),
        ];
    };

    // Ángulo a rotar para que quede a π/2 rad.
    let angle = Math.atan(a[1] / a[0]) - (Math.PI / 2);
    a = rot(-angle, a[0], a[1]);
    x = rot(-angle, x[0], x[1]);

    // Puede ser que la rotación anterior resulte en la viga
    // mirando hacia abajo.
    // Cuando eso pasa, rotar otros π radianes.
    if (a[1] > cam[1]) {
        a = rot(Math.PI, a[0], a[1]);
        x = rot(Math.PI, x[0], x[1]);
    }

    // Se limita la altura del proyectil para mantener la
    // perspectiva desde ese punto.
    if (x[1] + canvas.width < hh) {
        x[1] = -hh;
    }

    // dibuja el fondo
    ctx.fillStyle = "green";
    ctx.fillRect(0, hh, canvas.width, canvas.height);
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, canvas.width, hh);

    // dibuja viga
    const h = 4 * hh / 3;
    const K = 50;
    ctx.fillStyle = 'darkgrey';
    ctx.beginPath();
    ctx.moveTo(wh - K, canvas.height);
    ctx.lineTo(wh - K/2, h);
    ctx.lineTo(wh + K/2, h);
    ctx.lineTo(wh + K, canvas.height);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(wh, h, 40, 20, 0, 2 * Math.PI, false);
    ctx.fill();

    // dibuja el proyectil
    ctx.beginPath();
    ctx.fillStyle = "red";

    // proporción tamaño-distancia
    // entre más lejos, más pequeña la bola
    const f = 1 - (x[1] / -(1.6 * hh));
    ctx.arc(x[0] + wh, x[1] + canvas.width, 30 * f, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * Lee el valor de la barra de input.
 * Cambia la velocidad angular y modifica
 * el HTML para mostrar el cambio.
 */
function updateSpeed() {
    const el = document.getElementById('input');
    angSpeed = el.value;

    const v = document.getElementById('val');
    v.innerHTML = angSpeed;
}

/**
 * Función que se encarga de la animación.
 * Loop principal de la simulación:
 *     dibuja las vistas
 *     actualiza la posición de la bola
 */
function animate(time = 0) {
    const t = (time - start) / 1000;
    angle += angSpeed * t;

    const r = topView(t, angle, ball, canvas1, ctx1);
    ball.update(t, r[0], r[1], canvas1);
    frontView(r, ball, canvas2, ctx2);

    requestAnimationFrame(animate);
    start = time;
}

// Escuchas de teclas:
// asigna las teclas de espacio y r a sus
// respectivas funciones
document.addEventListener(
    'keypress',
    function(e) {
        switch (e.key) {
            case ' ':
                ball.launch();
                break;

            case 'r': case 'R':
                ball.reset();
                break;
        }
    }
)

let angle = 0;
let start = 0;
let angSpeed = null;
let ball = new Projectile(500, "red");

updateSpeed();
animate();

// Valente E. Morgado
// Cristian B. Gotchev
