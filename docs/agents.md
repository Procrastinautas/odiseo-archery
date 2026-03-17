<!-- Agentes: reglas para asistentes y colaboradores -->

# Agentes — Reglas para textos visibles al usuario

Propósito: asegurar que todo texto presentado al usuario final (etiquetas, botones, mensajes, placeholders, títulos, etc.) esté en español.

Regla principal

- Todos los textos visibles al usuario deben estar en español.

Ámbito

- Aplica a todas las interfaces del frontend y a cualquier texto que se muestre directamente al usuario final: carpetas principales: `src/app`, `src/components` y `public`.
- No aplica a comentarios de código, nombres de variables, mensajes de log internos, o documentación técnica (que pueden seguir en inglés si es necesario).

Ejemplos

- Correcto: "Iniciar sesión", "Perfil", "Guardar cambios", "Introduce tu nombre".
- Incorrecto: "Login", "Settings", "Save", "Enter your name".

Sugerencias de implementación

- Preferir archivos de localización (i18n) incluso si solo soportamos español ahora.
- Para revisar rápidamente, usar una búsqueda que detecte cadenas en inglés en el frontend. Por ejemplo:

```bash
grep -R "\b(Login|Sign in|Save|Cancel|Settings|Submit|Enter your)\b" src/app src/components || true
```

Cumplimiento y excepciones

- Si existe una razón válida para mostrar texto en otro idioma (por ejemplo, contenido del usuario), documentar la excepción en la PR y notificar al equipo de producto.

Contacto

- Si tienes dudas sobre la traducción o el término adecuado en español, consulta al equipo de producto o abre una PR con la sugerencia.
